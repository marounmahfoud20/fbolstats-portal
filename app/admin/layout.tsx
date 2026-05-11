import prisma from "@/lib/prisma";
import { connection } from "next/server";
import Sidebar from "./Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensure admin routes render at request time (not build time) before DB access.
  await connection();

  // Fetch leagues for the sidebar dropdown, sorted alphabetically.
  // If the database is temporarily unreachable, keep the admin UI usable.
  let leagues: Array<{ id: number; competitionName: string; type: string; footballType: string }> = [];
  let leagueCategories: Array<{ name: string; footballType: string }> = [];
  try {
    leagues = await prisma.$queryRaw<Array<{ id: number; competitionName: string; type: string; footballType: string }>>`
      SELECT
        "id",
        "competitionName",
        "type",
        COALESCE("footballType", 'club') AS "footballType"
      FROM "League"
      ORDER BY "competitionName" ASC
    `;
    try {
      leagueCategories = await prisma.$queryRaw<Array<{ name: string; footballType: string }>>`
        SELECT "name", COALESCE("footballType", 'club') AS "footballType"
        FROM "LeagueCategory"
        ORDER BY "name" ASC
      `;
    } catch {
      leagueCategories = [];
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Can't reach database server")) {
      console.error("Failed to load leagues in admin layout:", error);
    }
  }

  return (
    <div className="flex min-h-screen admin-page-bg">
      <Sidebar leagues={leagues} leagueCategories={leagueCategories} />
      <main className="flex-1 ml-[84px] overflow-x-hidden p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
