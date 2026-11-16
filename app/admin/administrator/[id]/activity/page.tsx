import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies, isGodAdmin } from "@/lib/adminAuth";

export const metadata = { title: "Account Activity Logs" };

const kinds: Record<string, string> = { login: "Sign-in", logout: "Sign-out", page_view: "Page visit", change: "Change" };
const formatAction = (action: string) => action.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());

export default async function AccountActivityPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; kind?: string }>;
}) {
  if (!isGodAdmin(getAdminUserFromCookies(await cookies()))) redirect("/admin");
  const { id } = await params;
  const accountId = Number(id);
  if (!Number.isSafeInteger(accountId) || accountId <= 0) notFound();
  const account = await prisma.adminAccount.findUnique({ where: { id: accountId }, select: { id: true, username: true } });
  if (!account) notFound();
  const filters = await searchParams;
  const requestedPage = Number(filters.page || "1");
  const kind = filters.kind && Object.hasOwn(kinds, filters.kind) ? filters.kind : "";
  const where = { OR: [{ accountId }, { accountId: null, username: account.username }], ...(kind ? { kind } : {}) };
  const total = await prisma.adminActivityLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / 50));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(1, requestedPage), totalPages) : 1;
  const logs = await prisma.adminActivityLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 50 });
  const pageHref = (number: number) => `?${new URLSearchParams({ page: String(number), ...(kind ? { kind } : {}) })}`;

  return (
    <div className="min-w-0 text-sm text-[#040f4f]">
      <Link href="/admin/administrator" className="mb-4 inline-block font-bold hover:underline">&larr; Administrator Accounts</Link>
      <h1 className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-3 text-lg font-bold">Activity Logs: {account.username}</h1>
      <p className="mb-4 text-xs">Activity is recorded from the time logging was enabled. Times are shown in Beirut time (DD/MM/YYYY). Passwords and form contents are never logged.</p>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-semibold">Activity type
          <select name="kind" defaultValue={kind} className="border border-gray-400 bg-white p-2">
            <option value="">All activity</option>
            {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="border border-[#040f4f] bg-[#f4a01c] px-4 py-2 font-bold">Filter</button>
        <span className="py-2 text-xs">{total} record{total === 1 ? "" : "s"}</span>
      </form>
      <div role="region" aria-label="Account activity logs" tabIndex={0} className="max-w-full overflow-x-auto border border-[#040f4f] bg-white">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="border-b border-[#040f4f] bg-gray-100"><tr>
            <th className="p-3">Date and time</th><th className="p-3">Type</th><th className="p-3">Action</th><th className="p-3">Page</th><th className="p-3">Record</th><th className="p-3">Result</th>
          </tr></thead>
          <tbody>
            {!logs.length && <tr><td colSpan={6} className="p-6 text-center">No activity recorded for this account yet.</td></tr>}
            {logs.map((log) => <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="whitespace-nowrap p-3">{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Beirut", dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}</td>
              <td className="whitespace-nowrap p-3">{kinds[log.kind] || log.kind}</td>
              <td className="p-3">{formatAction(log.action)}</td>
              <td className="p-3">{log.path?.startsWith("/admin") ? <Link href={log.path} className="hover:underline">{log.path}</Link> : log.path || "—"}</td>
              <td className="p-3">{log.details || "—"}</td>
              <td className={`p-3 font-semibold ${log.success ? "text-green-800" : "text-red-700"}`}>{log.success ? "Completed" : "Failed"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <nav aria-label="Activity pages" className="mt-4 flex items-center gap-4">
        {page > 1 && <Link href={pageHref(page - 1)} className="font-bold hover:underline">Previous</Link>}
        <span>Page {page} of {totalPages}</span>
        {page < totalPages && <Link href={pageHref(page + 1)} className="font-bold hover:underline">Next</Link>}
      </nav>
    </div>
  );
}
