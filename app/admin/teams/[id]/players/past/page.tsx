import { createEntityMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { isDatabaseConnectionError, retryDatabaseRead } from "@/lib/database-read";
import { nationalityFlag, resolvePositionName } from "@/lib/people-format";
import { resolveCountryName } from "@/lib/countries";

export const generateMetadata = createEntityMetadata("Past Players", "team");
export const dynamic = "force-dynamic";
export const revalidate = 0;

function displayName(person: { id: number; commonName: string | null; matchName: string | null; firstName: string | null; lastName: string | null }) {
  return person.commonName?.trim() || person.matchName?.trim() || `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || `Player ${person.id}`;
}

export default async function PastPlayersPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const teamId = Number(id);
  if (!Number.isSafeInteger(teamId) || teamId <= 0) notFound();

  let team;
  try {
    team = await retryDatabaseRead(() => prisma.team.findUnique({
      where: { id: teamId },
      include: {
        memberships: {
          where: { isActive: false, role: { equals: "Player", mode: "insensitive" } },
          include: { person: true },
          orderBy: [{ endDate: "desc" }, { id: "asc" }],
        },
      },
    }));
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return (
      <div role="alert" className="m-6 rounded border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-bold">Past players temporarily unavailable</h1>
        <p className="mt-2">The database connection failed. Please try again.</p>
        <Link href={`/admin/teams/${teamId}/players/past`} className="mt-4 inline-block font-semibold underline">Retry loading past players</Link>
      </div>
    );
  }

  if (!team) notFound();
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  const memberships = [...team.memberships].sort((a, b) =>
    (b.endDate || "").localeCompare(a.endDate || "") || collator.compare(displayName(a.person), displayName(b.person)) || (b.startDate || "").localeCompare(a.startDate || "") || a.id - b.id
  );

  return (
    <div className="p-6 text-[#040f4f]">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6 flex flex-wrap justify-between items-center gap-3">
        <h1 className="font-bold text-lg">Past Players: {team.name} ({memberships.length})</h1>
        <Link href={`/admin/teams/${team.id}`} className="font-bold text-sm hover:underline">Back to Team</Link>
      </div>
      <div className="bg-white border border-[#040f4f] overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm border-collapse">
          <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
            <tr>
              <th scope="col" className="p-3">ID</th>
              <th scope="col" className="p-3">Player</th>
              <th scope="col" className="p-3">Date of Birth</th>
              <th scope="col" className="p-3">Nationality</th>
              <th scope="col" className="p-3">Position</th>
              <th scope="col" className="p-3">Start Date</th>
              <th scope="col" className="p-3">End Date</th>
              <th scope="col" className="p-3">Membership</th>
            </tr>
          </thead>
          <tbody>
            {memberships.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">No past players found for this team.</td></tr>
            ) : memberships.map((membership) => {
              const person = membership.person;
              return (
                <tr key={membership.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-mono text-gray-500">{person.id}</td>
                  <td className="p-3 font-semibold"><Link href={`/admin/people/${person.id}`} className="text-blue-700 hover:underline">{displayName(person)}</Link></td>
                  <td className="p-3 whitespace-nowrap">{person.dob || "Unknown"}</td>
                  <td className="p-3">{nationalityFlag(person.nationality)} {resolveCountryName(person.nationality) || "Unknown"}</td>
                  <td className="p-3">{resolvePositionName(person.position) || "Unknown"}</td>
                  <td className="p-3 whitespace-nowrap">{membership.startDate || "Unknown"}</td>
                  <td className="p-3 whitespace-nowrap">{membership.endDate || "Unknown"}</td>
                  <td className="p-3"><Link href={`/admin/people/${person.id}/membership/${membership.id}`} className="text-blue-700 hover:underline">View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
