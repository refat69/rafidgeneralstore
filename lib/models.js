import mongoose from 'mongoose';
import { LocalCollection, getLocalStore, isUsingFallback } from './db.js';


const { Schema, models } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // bcrypt hash
    name: { type: String, default: '' },
    shopName: { type: String, default: 'আমার দোকান' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'সাধারণ' },
    unit: { type: String, default: 'পিস' },
    buyPrice: { type: Number, default: 0 },
    sellPrice: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    lowStockAt: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SaleSchema = new Schema(
  {
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        qty: { type: Number },
        price: { type: Number },
        buyPrice: { type: Number, default: 0 },
        total: { type: Number },
      },
    ],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'cash' }, // cash | bkash | both
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BakiSchema = new Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    // positive = we are owed (পাওনা), negative = we owe (বাকি)
    amount: { type: Number, required: true },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BkashSchema = new Schema(
  {
    bkashType: { type: String, default: 'personal' }, // agent | personal | b2b
    type: { type: String, required: true }, // income | expense | sale | cashin | cashout | b2b
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    customerCharge: { type: Number, default: 0 },
    ourCost: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    ref: { type: String, default: '' }, // e.g. sale id
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RechargeSchema = new Schema(
  {
    phone: { type: String, required: true },
    operator: { type: String, required: true },
    amount: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ExpenseSchema = new Schema(
  {
    category: { type: String, required: true, default: 'অন্যান্য' },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'cash' }, // cash | bkash
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const StockLogSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    qtyAdded: { type: Number, required: true },
    buyPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const mongooseUser = models.User || mongoose.model('User', UserSchema);
const mongooseProduct = models.Product || mongoose.model('Product', ProductSchema);
const mongooseSale = models.Sale || mongoose.model('Sale', SaleSchema);
const mongooseCustomer = models.Customer || mongoose.model('Customer', CustomerSchema);
const mongooseBaki = models.Baki || mongoose.model('Baki', BakiSchema);
const mongooseBkash = models.Bkash || mongoose.model('Bkash', BkashSchema);
const mongooseRecharge = models.Recharge || mongoose.model('Recharge', RechargeSchema);
const mongooseExpense = models.Expense || mongoose.model('Expense', ExpenseSchema);
const mongooseStockLog = models.StockLog || mongoose.model('StockLog', StockLogSchema);

function createModelWrapper(name, mongooseModel) {
  const getTarget = () => {
    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (isConnected && !isUsingFallback()) {
      return mongooseModel;
    }
    return new LocalCollection(name, getLocalStore());
  };

  return new Proxy({}, {
    get(target, prop) {
      const active = getTarget();
      const val = active[prop];
      if (typeof val === 'function') {
        return val.bind(active);
      }
      return val;
    }
  });
}


export const User = createModelWrapper('User', mongooseUser);
export const Product = createModelWrapper('Product', mongooseProduct);
export const Sale = createModelWrapper('Sale', mongooseSale);
export const Customer = createModelWrapper('Customer', mongooseCustomer);
export const Baki = createModelWrapper('Baki', mongooseBaki);
export const Bkash = createModelWrapper('Bkash', mongooseBkash);
export const Recharge = createModelWrapper('Recharge', mongooseRecharge);
export const Expense = createModelWrapper('Expense', mongooseExpense);
export const StockLog = createModelWrapper('StockLog', mongooseStockLog);

