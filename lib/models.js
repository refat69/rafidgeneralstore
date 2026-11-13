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
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
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

const BkashAccountSchema = new Schema(
  {
    name: { type: String, default: '' },
    number: { type: String, required: true },
    accountType: { type: String, required: true, default: 'personal' }, // personal | agent
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const BkashSchema = new Schema(
  {
    bkashType: { type: String, default: 'personal' }, // agent | personal | b2b
    accountId: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    type: { type: String, required: true }, // cust_cashout | cust_cashin | self_cashout | agent_cashin | agent_cashout | income | expense | b2b | bundle_expense
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    cashAmount: { type: Number, default: 0 }, // Physical cash given or taken
    ratePerThousand: { type: Number, default: 0 },
    customerCharge: { type: Number, default: 0 },
    ourCost: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    ref: { type: String, default: '' }, // e.g. sale id, bundle
    paymentSource: { type: String, default: 'sim_balance' }, // sim_balance | cash
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RechargeSchema = new Schema(
  {
    phone: { type: String, default: '' },
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

const OfferSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CustomerUserSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isMerged: { type: Boolean, default: false },
    mergedCustomerId: { type: String, default: '' },
    mergedCustomerPhone: { type: String, default: '' },
    mergedCustomerName: { type: String, default: '' },
    status: { type: String, default: 'pending' }, // pending | merged
  },
  { timestamps: true }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    area: { type: String, default: 'jahangirnagar_boalmari' },
    deliveryFee: { type: Number, default: 20 },
    paymentMethod: { type: String, default: 'cod' }, // cod | bkash
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        qty: { type: Number },
        price: { type: Number },
        unit: { type: String },
        total: { type: Number },
        imageUrl: { type: String }
      }
    ],
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending' }, // pending | processing | delivered | cancelled
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CashTransactionSchema = new Schema(
  {
    type: { type: String, required: true }, // 'in' (নগদ জমা / ক্যাশ ইন) | 'out' (নগদ খরচ / উত্তোলন)
    source: { type: String, default: 'home_capital' }, // 'home_capital' (বাড়ি থেকে আনা ক্যাশ), 'withdraw_home' (বাড়ি পাঠানো / উত্তোলন), 'manual_in', 'manual_out'
    category: { type: String, default: 'মূলধন' }, // 'বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)', 'ব্যবসায় মূলধন', 'বাড়ি পাঠানো / উত্তোলন', etc.
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BkashPartnerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    openingDue: { type: Number, default: 0 }, // পূর্বের / আগের পাওনা
    bkashNumbers: [{ type: String }],
    bankDetails: { type: String, default: '' },
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BkashB2BTransactionSchema = new Schema(
  {
    partnerId: { type: String, required: true },
    partnerName: { type: String, required: true },
    partnerPhone: { type: String, default: '' },
    type: { type: String, required: true }, // 'sent' (বিকাশ পাঠানো) | 'received' (ব্যাংক প্রাপ্তি)
    amount: { type: Number, required: true },
    targetBkashNumber: { type: String, default: '' },
    ourAccountId: { type: String, default: '' },
    ourAccountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    paymentMethod: { type: String, default: 'bank' },
    trxId: { type: String, default: '' },
    note: { type: String, default: '' },
    balanceAfter: { type: Number, default: 0 },
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
const mongooseBkashAccount = models.BkashAccount || mongoose.model('BkashAccount', BkashAccountSchema);
const mongooseRecharge = models.Recharge || mongoose.model('Recharge', RechargeSchema);
const mongooseExpense = models.Expense || mongoose.model('Expense', ExpenseSchema);
const mongooseStockLog = models.StockLog || mongoose.model('StockLog', StockLogSchema);
const mongooseOffer = models.Offer || mongoose.model('Offer', OfferSchema);
const mongooseCustomerUser = models.CustomerUser || mongoose.model('CustomerUser', CustomerUserSchema);
const mongooseOrder = models.Order || mongoose.model('Order', OrderSchema);
const mongooseCashTransaction = models.CashTransaction || mongoose.model('CashTransaction', CashTransactionSchema);
const mongooseBkashPartner = models.BkashPartner || mongoose.model('BkashPartner', BkashPartnerSchema);
const mongooseBkashB2BTransaction = models.BkashB2BTransaction || mongoose.model('BkashB2BTransaction', BkashB2BTransactionSchema);

function createModelWrapper(name, mongooseModel) {
  const getTarget = () => {
    if (!isUsingFallback()) {
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
export const BkashAccount = createModelWrapper('BkashAccount', mongooseBkashAccount);
export const Recharge = createModelWrapper('Recharge', mongooseRecharge);
export const Expense = createModelWrapper('Expense', mongooseExpense);
export const StockLog = createModelWrapper('StockLog', mongooseStockLog);
export const Offer = createModelWrapper('Offer', mongooseOffer);
export const CustomerUser = createModelWrapper('CustomerUser', mongooseCustomerUser);
export const Order = createModelWrapper('Order', mongooseOrder);
export const CashTransaction = createModelWrapper('CashTransaction', mongooseCashTransaction);
export const BkashPartner = createModelWrapper('BkashPartner', mongooseBkashPartner);
export const BkashB2BTransaction = createModelWrapper('BkashB2BTransaction', mongooseBkashB2BTransaction);



