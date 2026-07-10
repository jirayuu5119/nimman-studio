import AdminGuard from "@/components/AdminGuard";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminGuard>{children}</AdminGuard>;
}
