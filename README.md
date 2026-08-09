# 🏪 দোকান ড্যাশবোর্ড — Shop Dashboard

Next.js + MongoDB দিয়ে বানানো দোকানের হিসাব ম্যানেজমেন্ট সিস্টেম।

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

## 🚀 চালানোর নিয়ম

### লোকাল ডেভেলপমেন্ট (বিল্ট-ইন MongoDB)
```bash
npm install
npm run dev
```
খুলবে: http://localhost:3000

প্রথমবার চালালে একটি **in-memory MongoDB** (mongodb-memory-server) শুরু হবে — কোথাও সেটআপ লাগে না। শুরুতেই sample ডেটা (পণ্য, বিক্রি, বাকি, bKash, খরচ) নিজে থেকে ঢুকে যায়।

### বাস্তব MongoDB (Atlas) দিয়ে
মনে করো তুমি **MongoDB Atlas** (free tier) ব্যবহার করতে চাও। তাহলে:

1. [cloud.mongodb.com](https://cloud.mongodb.com) এ free cluster বানাও
2. **Database User** বানাও ও IP allowlist-এ `0.0.0.0/0` দাও (অথবা তোমার IP)
3. Connection string copy করো (যেমন `mongodb+srv://user:pass@cluster.mongodb.net/`)
4. এভাবে চালাও:
```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net" npm run dev
```

একবার বাস্তব MongoDB-তে দিলে ডেটা স্থায়ীভাবে সংরক্ষিত থাকবে — সার্ভার বন্ধ করলেও হারাবে না। (in-memory MongoDB রিস্টার্টে ডেটা হারায়)

### প্রোডাকশন বিল্ড
```bash
npm run build
npm start
```

## 🔑 গুরুত্বপূর্ণ Environment Variables
| ভেরিয়েবল | ব্যবহার | ডিফল্ট |
|---|---|---|
| `MONGODB_URI` | বাস্তব MongoDB-র connection string | (খালি → in-memory) |
| `AUTH_SECRET` | লগইন session signature-এর key | shop-dashboard-secret-change-me |

> **দারুণ নিরাপত্তা:** `AUTH_SECRET`-এ অবশ্যই নিজের মতো লম্বা র্যান্ডম স্ট্রিং দাও।

## 📁 প্রজেক্ট স্ট্রাকচার
```
shop-dashboard/
├─ app/
│  ├─ api/                 # সব API routes
│  │  ├─ auth/  products/  sales/  baki/  bkash/  expense/  stats/  report/
│  ├─ login/page.js        # লগইন পেজ
│  └─ (dashboard)/         # sidebar ও সব মডিউল পেজ
├─ lib/
│  ├─ db.js                # MongoDB সংযোগ (in-memory / real)
│  ├─ models.js            # Mongoose models
│  ├─ auth.js              # session logic
│  ├─ seed.js              # sample ডেটা
│  └─ money.js             # টাকা ফরম্যাটিং
└─ next.config.mjs
```
