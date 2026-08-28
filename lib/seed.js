import bcrypt from 'bcryptjs';
import { User } from './models.js';

const users = [
  { username: 'admin', password: 'admin123', name: 'Admin', shopName: 'রাফিদ জেনারেল স্টোর' },
  { username: 'rafid', password: 'Rafid69', name: 'Rafid', shopName: 'Rafid General Store' },
];

export async function seedIfEmpty() {
  for (const u of users) {
    const existing = await User.findOne({ username: u.username });
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      await User.create({
        username: u.username,
        password: hash,
        name: u.name,
        shopName: u.shopName,
      });
      console.log(`[seed] admin user created (${u.username} / ${u.password})`);
    }
  }
}
