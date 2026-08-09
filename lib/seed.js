import bcrypt from 'bcryptjs';
import { User, Product, Sale, Baki, Bkash, Expense } from './models.js';


const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export async function seedIfEmpty() {
  const existing = await User.findOne({ username: 'rafid' });
  if (!existing) {
    const hash = await bcrypt.hash('Rafid69', 10);
    await User.create({
      username: 'rafid',
      password: hash,
      name: 'Rafid',
      shopName: 'Rafid General Store',
    });
    console.log('[seed] admin user created (rafid / Rafid69)');
  }
}

