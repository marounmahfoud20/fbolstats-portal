import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { bulkUpdateMemberships } from '@/lib/actions';
import Link from 'next/link';

// Helper function to chop the database "YYYY-MM-DD" string into pieces for the input boxes
const splitDate = (dateStr?: string | null) => {
  if (!dateStr) return { year: '', month: '', day: '' };
  const parts = dateStr.split('-');
  return { year: parts[0] || '', month: parts[1] || '', day: parts[2] || '' };
};

export default async function EditAllMembershipsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const personId = parseInt(params.id);
  const newRows = Array.from({ length: 12 });

  if (isNaN(personId)) {
    notFound();
  }

  // Fetch the player and all their memberships
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        include: { team: true },
        orderBy: { startDate: 'desc' }
      }
    }
  });

  if (!person) {
    notFound();
  }

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, gender: true, type: true },
  });

  return (
    <div className="p-6">

      {/* Header */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6 flex justify-between items-center">
        <h1 className="text-[#040f4f] font-bold text-lg">
          Bulk Edit Memberships: {person.firstName} {person.lastName} (ID: {person.id})
        </h1>
        <Link href={`/admin/people/${person.id}`} className="text-[#040f4f] hover:opacity-70 font-bold border border-[#040f4f] px-3 py-1 bg-white text-sm">
          Cancel
        </Link>
      </div>

      <div className="bg-white border border-[#040f4f] overflow-x-auto p-4">

        <form action={bulkUpdateMemberships} className="text-[#040f4f] text-sm">
            <input type="hidden" name="personId" value={person.id} />
            <input type="hidden" name="newRowCount" value={newRows.length} />

            <table className="w-full text-left border-collapse mb-6">
              <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
                <tr>
                  <th className="p-2">Team Name</th>
                  <th className="p-2">Role</th>
                  <th className="p-2 text-center">Active</th>
                  <th className="p-2 text-center">Start Date (DD/MM/YYYY)</th>
                  <th className="p-2 text-center">End Date (DD/MM/YYYY)</th>
                </tr>
              </thead>
              <tbody>
                {person.memberships.length === 0 ? (
                  <tr className="border-b border-gray-200">
                    <td colSpan={5} className="text-center p-4 text-[#040f4f]">
                      No existing memberships. Add new rows below.
                    </td>
                  </tr>
                ) : null}
                {person.memberships.map((m) => {
                  const sDate = splitDate(m.startDate);
                  const eDate = splitDate(m.endDate);

                  return (
                    <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-50">

                      {/* Hidden ID to tell the backend which membership this row belongs to */}
                      <input type="hidden" name="membershipId" value={m.id} />

                      <td className="p-2 font-bold">
                        {m.team?.name || "Unknown Team"}
                        <span className="block text-xs font-normal text-gray-500 capitalize">{m.team?.gender || "Both"} • {m.team?.type || "Club"}</span>
                      </td>

                      <td className="p-2">
                        <select name={`role_${m.id}`} defaultValue={m.role} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#f4a01c] w-full">
                          <option value="Player">Player</option>
                          <option value="coach">Coach</option>
                          <option value="assistant_coach">Assistant Coach</option>
                          <option value="team_manager">Team Manager</option>
                          <option value="sporting_director">Sporting Director</option>
                          <option value="physiotherapist">Physiotherapist</option>
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <select name={`active_${m.id}`} defaultValue={m.isActive ? "yes" : "no"} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#f4a01c]">
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <input type="text" name={`startDay_${m.id}`} defaultValue={sDate.day} placeholder="DD" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                          <input type="text" name={`startMonth_${m.id}`} defaultValue={sDate.month} placeholder="MM" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                          <input type="text" name={`startYear_${m.id}`} defaultValue={sDate.year} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={4} />
                        </div>
                      </td>

                      <td className="p-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <input type="text" name={`endDay_${m.id}`} defaultValue={eDate.day} placeholder="DD" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                          <input type="text" name={`endMonth_${m.id}`} defaultValue={eDate.month} placeholder="MM" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                          <input type="text" name={`endYear_${m.id}`} defaultValue={eDate.year} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={4} />
                        </div>
                      </td>

                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={5} className="p-2 bg-[#f2f2f2] border-y border-[#040f4f] font-bold">
                    Add New Memberships
                  </td>
                </tr>
                {newRows.map((_, i) => (
                  <tr key={`new-${i}`} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2">
                      <select
                        name={`new_teamId_${i}`}
                        defaultValue=""
                        className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#f4a01c] w-full bg-white"
                      >
                        <option value=""></option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.gender || "both"} • {t.type || "club"})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2">
                      <select name={`new_role_${i}`} defaultValue="Player" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#f4a01c] w-full">
                        <option value="Player">Player</option>
                        <option value="coach">Coach</option>
                        <option value="assistant_coach">Assistant Coach</option>
                        <option value="team_manager">Team Manager</option>
                        <option value="sporting_director">Sporting Director</option>
                        <option value="physiotherapist">Physiotherapist</option>
                      </select>
                    </td>

                    <td className="p-2 text-center">
                      <select name={`new_active_${i}`} defaultValue="yes" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#f4a01c]">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>

                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <input type="text" name={`new_startDay_${i}`} placeholder="DD" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                        <input type="text" name={`new_startMonth_${i}`} placeholder="MM" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                        <input type="text" name={`new_startYear_${i}`} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={4} />
                      </div>
                    </td>

                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <input type="text" name={`new_endDay_${i}`} placeholder="DD" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                        <input type="text" name={`new_endMonth_${i}`} placeholder="MM" className="border border-[#040f4f] p-1.5 w-10 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={2} />
                        <input type="text" name={`new_endYear_${i}`} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#f4a01c]" maxLength={4} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-4 border-t border-[#040f4f] flex justify-end">
              <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-8 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
                Save All Changes
              </button>
            </div>
          </form>

      </div>
    </div>
  );
}
