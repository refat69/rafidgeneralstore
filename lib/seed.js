import bcrypt from 'bcryptjs';
import { User, Product, Sale, Baki, Bkash, Expense } from './models.js';


const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export async function seedIfEmpty() {
  if ((await User.countDocuments()) === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hash,
      name: 'Admin',
      shopName: 'আমার দোকান',
    });
    console.log('[seed] admin user created (admin / admin123)');
  }
}
