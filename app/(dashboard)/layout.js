import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { seedIfEmpty } from '@/lib/seed';
import SidebarWrapper from './SidebarWrapper';

export default async function DashboardLayout({ children }) {
  const uid = requireAuth();
  await connectDB();
  await seedIfEmpty();
  let user = await User.findById(uid);
  if (user) {
    user = JSON.parse(JSON.stringify(user));
  }

  return (
    <SidebarWrapper user={user}>
      {children}
    </SidebarWrapper>
  );
}

