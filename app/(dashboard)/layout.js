import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { seedIfEmpty } from '@/lib/seed';
import SidebarWrapper from './SidebarWrapper';

export default async function DashboardLayout({ children }) {
  const uid = requireAuth();
  await connectDB();
  await seedIfEmpty();
  const user = await User.findById(uid);

  return (
    <SidebarWrapper user={user}>
      {children}
    </SidebarWrapper>
  );
}

