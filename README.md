# 🏪 রাফিদ জেনারেল স্টোর — দোকান ড্যাশবোর্ড (Mobile App)

Next.js + MongoDB দিয়ে বানানো দোকানের হিসাব ম্যানেজমেন্ট সিস্টেম। এটি এখন **মোবাইল অ্যাপ (PWA)** হিসেবে ইনস্টল করা যায় — ফোনের হোম স্ক্রিনে যোগ করলে সাধারণ অ্যাপের মতো দেখায় ও চলে।

## 📱 মোবাইল অ্যাপ হিসেবে ব্যবহার

1. ওয়েবসাইট ফোনের ব্রাউজারে খোলো।
2. **Android/Chrome:** ব্রাউজারের মেনু → **"Add to Home Screen" / "Install app"** চাপলে হোম স্ক্রিনে অ্যাপ আইকন তৈরি হবে।
3. **iPhone/Safari:** নিচের **Share (⬆️)** বাটন → **"Add to Home Screen"** চাপো।
4. তারপর হোম স্ক্রিন থেকে ওপেন করলে পূর্ণ স্ক্রিন অ্যাপের মতো চলবে, নিচে **অ্যাপ-স্টাইল নেভিগেশন বার** (হোম, বিক্রি, বাকি, বিকাশ, আরও) থাকবে।

> অ্যাপ ইন্সটল করা হলে **অফলাইনেও** ড্যাশবোর্ড খোলা যাবে — ইন্টারনেট থাকলে লাইভ ডেটা আপডেট হবে।

## ✨ ফিচার / Features

| মডিউল | বর্ণনা |
|---|---|
| 📊 **Dashboard** | আজকের ও মোট বিক্রি, বাকি, bKash ব্যালেন্স, স্টক মূল্য, খরচ — সব এক নজরে |
| 🛒 **Sell / বিক্রি** | পণ্য বাছাই করে কার্ট, ডিসকাউন্ট, নগদ/bKash পেমেন্ট, স্বয়ংক্রিয় স্টক কমানো ও বাকি যোগ |
| 📦 **Stock / স্টক** | পণ্য যোগ, কেনা-বিক্রির দাম, মুনাফা/ইউনিট, কম স্টক সতর্কতা |
| 🧾 **Baki / বাকি** | গ্রাহকের পাওনা ও দেনা, জমা নেওয়া (collection) |
| 📱 **bKash** | আয়-ব্যয় লেজার, ব্যালেন্স হিসাব — বিক্রির bKash পেমেন্ট নিজে থেকেই যোগ হয় |
| 💸 **Expense / খরচ** | ক্যাটাগরি ধরে খরচ, bKash দিয়ে দিলে bKash লেজারেও যায় |
| 📈 **Report** | মোট লাভ (নিট মুনাফা), গত ১৪ দিনের বিক্রির চার্ট, সেরা পণ্য, খরচ বিশ্লেষণ |

## 🔐 লগইন

- **ইউজারনেম:** `admin`
- **পাসওয়ার্ড:** `admin123`

> ⚠️ Production-এ ব্যবহারের আগে অবশ্যই পাসওয়ার্ড বদলে নাও।

## 💾 ডেটা কোথায় থাকে? (Real Data)

সবচেয়ে গুরুত্বপূর্ণ: **ডিফল্টতেই তোমার ডেটা স্থায়ীভাবে সেভ হয়** `data/shopdb.json` ফাইলে। সার্ভার বন্ধ করলেও ডেটা হারাবে না।

- কোনো MongoDB সেটআপ **লাগবে না** — `npm run dev` চালালেই সব কাজ করবে।
- ডেটা ফাইল `data/shopdb.json` — এটা কার্যত তোমার পুরো দোকানের হিসাবের ব্যাকআপ।

### MongoDB Atlas (ক্লাউড ডেটা) — ঐচ্ছিক

মনে করো তুমি **MongoDB Atlas** (free tier) ব্যবহার করতে চাও। তাহলে:

1. [cloud.mongodb.com](https://cloud.mongodb.com) এ free cluster বানাও
2. **Database User** বানাও ও IP allowlist-এ `0.0.0.0/0` দাও (অথবা তোমার IP)
3. Connection string copy করো (যেমন `mongodb+srv://user:pass@cluster.mongodb.net/`)
4. এভাবে চালাও:
```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net" npm run dev
```

> `MONGODB_URI` **না দিলে** ডিফল্টে `data/shopdb.json`-এ সব সেভ হয়। এটাই সবচেয়ে নিরাপদ ও সহজ।

## 🚀 চালানোর নিয়ম

### লোকাল ডেভেলপমেন্ট
```bash
npm install
npm run dev
```
খুলবে: http://localhost:3000

### প্রোডাকশন বিল্ড
```bash
npm run build
npm start
```

## 🔑 গুরুত্বপূর্ণ Environment Variables

| ভেরিয়েবল | ব্যবহার | ডিফল্ট |
|---|---|---|
| `MONGODB_URI` | বাস্তব MongoDB (Atlas) connection string | (খালি → `data/shopdb.json`) |
| `AUTH_SECRET` | লগইন session signature-এর key | shop-dashboard-secret-change-me |
| `USE_MEMORY_DB` | শুধু টেস্টের জন্য in-memory DB (`1` দিলে) | (খালি) |

> **নিরাপত্তা:** `AUTH_SECRET`-এ অবশ্যই নিজের মতো লম্বা র্যান্ডম স্ট্রিং দাও।

## 📁 প্রজেক্ট স্ট্রাকচার

```
rafidgeneralstore/
├─ app/
│  ├─ api/                 # সব API routes
│  ├─ manifest.js          # PWA/app install manifest
│  ├─ (dashboard)/         # sidebar ও সব মডিউল পেজ
│  └─ login/page.js        # লগইন পেজ
├─ public/
│  ├─ sw.js                # Service Worker (offline)
│  └─ icons/               # App icon
├─ lib/
│  ├─ db.js                # ডেটা সংযোগ (JSON / MongoDB)
│  ├─ models.js            # Models
│  ├─ auth.js              # session logic
│  └─ seed.js              # default admin user
└─ data/shopdb.json        # 💾 তোমার দোকানের রিয়েল ডেটা
```
