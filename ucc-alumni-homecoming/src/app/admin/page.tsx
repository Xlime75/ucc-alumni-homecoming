
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions, isAdminEmail } from "@/lib/auth";
import DashboardContent from "./dashboard-content";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(session.user.email)) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-800">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-red-700">
          You do not have administrator permissions.
        </p>
      </div>
    );
  }

  return <DashboardContent />;
}
