import prisma from "@/lib/prisma";
import { createAdminAccount, deleteAdminAccount, updateAdminAccount } from "@/lib/actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUserFromCookies, isGodAdmin } from "@/lib/adminAuth";

type AdminAccountRow = {
  id: number;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default async function AdministratorPage() {
  const cookieStore = await cookies();
  const adminUser = getAdminUserFromCookies(cookieStore);
  if (!isGodAdmin(adminUser)) {
    redirect("/admin");
  }

  let accounts: AdminAccountRow[] = [];
  try {
    accounts = await prisma.$queryRaw<AdminAccountRow[]>`
      SELECT "id", "username", "isActive", "createdAt", "updatedAt"
      FROM "AdminAccount"
      ORDER BY "username" ASC
    `;
  } catch {
    accounts = [];
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold text-[#040f4f]">Administrator Accounts</h1>
        </div>

        <div className="mb-8 border border-[#040f4f] bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-[#040f4f]">Create New Account</h2>
          <form action={createAdminAccount} className="grid grid-cols-1 gap-4 text-sm text-[#040f4f] md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block font-semibold">Username</label>
              <input name="username" required className="w-full border border-[#040f4f] p-2 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Password</label>
              <input name="password" type="password" required className="w-full border border-[#040f4f] p-2 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            <button type="submit" className="h-[42px] border border-[#040f4f] bg-[#f4a01c] px-6 font-bold text-[#040f4f] transition-colors hover:bg-[#040f4f] hover:text-[#f4a01c]">
              Create
            </button>
          </form>
        </div>

        <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Existing Accounts</div>
        <div className="space-y-2">
          {accounts.length === 0 ? (
            <div className="border border-[#040f4f] bg-white p-4 text-sm italic text-[#040f4f]/70">
              No accounts yet. Create the first one above.
            </div>
          ) : (
            accounts.map((a) => (
              <form key={a.id} action={updateAdminAccount} className="grid grid-cols-1 gap-2 border border-[#040f4f]/30 bg-white p-3 md:grid-cols-[70px_1fr_1fr_160px_auto_auto] md:items-end">
                <input type="hidden" name="id" value={a.id} />
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#040f4f]/70">ID</label>
                  <div className="border border-[#040f4f]/20 bg-[#f9fafb] p-2 font-mono text-xs">{a.id}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Username</label>
                  <input name="username" defaultValue={a.username} required className="w-full border border-[#040f4f] p-2 text-sm outline-none focus:ring-1 focus:ring-[#040f4f]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">New Password (Optional)</label>
                  <input name="password" type="password" placeholder="Leave blank to keep current password" className="w-full border border-[#040f4f] p-2 text-sm outline-none focus:ring-1 focus:ring-[#040f4f]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Status</label>
                  <div className="flex gap-4 rounded border border-[#040f4f]/25 bg-[#f8fafc] px-3 py-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#040f4f]">
                      <input type="radio" name="isActive" value="yes" defaultChecked={a.isActive} className="accent-[#040f4f]" />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#040f4f]">
                      <input type="radio" name="isActive" value="no" defaultChecked={!a.isActive} className="accent-[#040f4f]" />
                      Inactive
                    </label>
                  </div>
                </div>
                <button type="submit" className="border border-[#0a7a36] bg-[#16a34a] px-4 py-2 text-xs font-bold text-white hover:bg-[#15803d] transition-colors">
                  Save
                </button>
                <button
                  formAction={deleteAdminAccount}
                  className="border border-[#dc2626] bg-white px-4 py-2 text-xs font-bold text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors"
                >
                  Delete
                </button>
              </form>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
