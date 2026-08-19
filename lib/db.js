import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let mongod = null;
let isFallbackMode = false;
let localStoreInstance = null;

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

class LocalStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[db-fallback] Failed to read JSON file:', e);
      this.data = {};
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[db-fallback] Failed to write JSON file:', e);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }
}

function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const key in query) {
    if (query[key] !== undefined) {
      if (String(item[key]) !== String(query[key])) {
        return false;
      }
    }
  }
  return true;
}

function cloneDoc(doc) {
  if (!doc) return null;
  const cloned = JSON.parse(JSON.stringify(doc));
  if (cloned._id) {
    cloned._id = String(cloned._id);
  }
  return cloned;
}

function createQueryChain(items) {
  let result = items.map(cloneDoc);
  const chain = {
    sort(sortObj) {
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key];
      result.sort((a, b) => {
        let valA = a[key] !== undefined ? (new Date(a[key]).getTime() || a[key]) : 0;
        let valB = b[key] !== undefined ? (new Date(b[key]).getTime() || b[key]) : 0;
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
        return 0;
      });
      return chain;
    },
    limit(n) {
      result = result.slice(0, n);
      return chain;
    },
    lean() {
      return chain;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(result).catch(reject);
    }
  };
  return chain;
}

export class LocalCollection {
  constructor(name, store) {
    this.name = name;
    this.store = store;
  }

  get items() {
    return this.store.getCollection(this.name);
  }

  async countDocuments(query = {}) {
    const list = this.items.filter(item => matchQuery(item, query));
    return list.length;
  }

  async findOne(query = {}) {
    const item = this.items.find(item => matchQuery(item, query));
    return item ? cloneDoc(item) : null;
  }

  async findById(id) {
    if (!id) return null;
    const sid = String(id);
    const item = this.items.find(item => String(item._id) === sid);
    return item ? cloneDoc(item) : null;
  }

  find(query = {}) {
    const filtered = this.items.filter(item => matchQuery(item, query));
    return createQueryChain(filtered);
  }

  async create(data) {
    if (Array.isArray(data)) {
      return this.insertMany(data);
    }
    const doc = {
      _id: generateId(),
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.push(doc);
    this.store.save();
    return cloneDoc(doc);
  }

  async insertMany(array) {
    const docs = array.map(data => ({
      _id: generateId(),
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    this.items.push(...docs);
    this.store.save();
    return docs.map(cloneDoc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const sid = String(id);
    const index = this.items.findIndex(item => String(item._id) === sid);
    if (index === -1) return null;

    const item = this.items[index];

    if (update.$inc) {
      for (const field in update.$inc) {
        item[field] = (Number(item[field]) || 0) + Number(update.$inc[field]);
      }
    }
    for (const key in update) {
      if (key !== '$inc') {
        item[key] = update[key];
      }
    }
    item.updatedAt = new Date().toISOString();
    this.items[index] = item;
    this.store.save();
    return cloneDoc(item);
  }

  async findByIdAndDelete(id) {
    const sid = String(id);
    const index = this.items.findIndex(item => String(item._id) === sid);
    if (index === -1) return null;
    const [deleted] = this.items.splice(index, 1);
    this.store.save();
    return cloneDoc(deleted);
  }
}

export function getLocalStore() {
  if (!localStoreInstance) {
    const dbPath = path.join(process.cwd(), 'data', 'shopdb.json');
    localStoreInstance = new LocalStore(dbPath);
  }
  return localStoreInstance;
}

export function isUsingFallback() {
  return isFallbackMode;
}

async function startMemoryServer() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  if (!mongod) {
    mongod = await MongoMemoryServer.create({
      binary: { version: process.env.MONGODB_VERSION || '7.0.14' },
    });
  }
  const uri = mongod.getUri('shopdb');
  await mongoose.connect(uri, { dbName: 'shopdb' });
  console.log('[db] using in-memory MongoDB at', uri);
  return mongoose.connection;
}

async function tryLocalMongo() {
  const uri = 'mongodb://127.0.0.1:27017/shopdb';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
  console.log('[db] connected to local MongoDB at', uri);
  return mongoose.connection;
}

async function startRealServer(uri) {
  await mongoose.connect(uri, { dbName: 'shopdb' });
  console.log('[db] connected to MongoDB Atlas');
  isFallbackMode = false;
  return mongoose.connection;
}

const cached = global.__mongooseCache || { conn: null, promise: null };
global.__mongooseCache = cached;

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  const mongoUri = process.env.MONGODB_URI || '';

  if (!cached.promise || mongoose.connection.readyState !== 1) {
    cached.promise = (async () => {
      // 1. Try MONGODB_URI if specified
      if (mongoUri) {
        try {
          return await startRealServer(mongoUri);
        } catch (err) {
          console.warn('[db] Failed to connect to MONGODB_URI, trying fallback...', err.message);
          await mongoose.disconnect().catch(() => {});
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Failed to connect to MongoDB Atlas in production: ${err.message}`);
          }
        }
      } else if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI environment variable is missing in production!');
      }

      // 2. Try local MongoDB instance if running
      try {
        return await tryLocalMongo();
      } catch (err) {
        await mongoose.disconnect().catch(() => {});
      }

      // 3. Try MongoMemoryServer
      try {
        return await startMemoryServer();
      } catch (err) {
        console.warn('[db] MongoMemoryServer unavailable:', err.message);
        await mongoose.disconnect().catch(() => {});
      }

      // 4. Fallback to Local JSON DB Store
      console.log('[db] using local persistent JSON database at ./data/shopdb.json');
      isFallbackMode = true;
      getLocalStore();
      return { isFallback: true };
    })().catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}


