import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { updateMembership } from "@/lib/actions";

function splitDate(dateStr?: string | null) {
  if (!dateStr) return { year: "", month: "", day: "" };
  const [year, month, day] = dateStr.split("-");
  return { year: year || "", month: month || "", day: day || "" };
}

export default async function MembershipDetailsPage(
  props: { params: Promise<{ id: string; membershipId: string }> }
) {
  const params = await props.params;
  const personId = parseInt(params.id, 10);
  const membershipId = parseInt(params.membershipId, 10);

  if (!personId || !membershipId) notFound();

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { person: true, team: true },
  });

  if (!membership || membership.personId !== personId) notFound();

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, gender: true, type: true },
  });

  const start = splitDate(membership.startDate);
  const end = splitDate(membership.endDate);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between border border-[#040f4f] bg-[#f4a01c] p-3">
        <h1 className="text-lg font-bold text-[#040f4f]">Membership Details (id: {membership.id})</h1>
        <Link href={`/admin/people/${personId}`} className="border border-[#040f4f] bg-white px-3 py-1 text-sm font-bold text-[#040f4f]">
          Back
        </Link>
      </div>

      <div className="max-w-3xl border border-[#040f4f] bg-white p-4">
        <form action={updateMembership} className="space-y-4 text-sm text-[#040f4f]">
          <input type="hidden" name="personId" value={personId} />
          <input type="hidden" name="membershipId" value={membership.id} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Team</label>
              <select name="teamId" defaultValue={membership.teamId} className="border border-[#040f4f] p-1.5 bg-white">
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.gender || "both"} • {t.type || "club"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Role</label>
              <select name="role" defaultValue={membership.role} className="border border-[#040f4f] p-1.5 bg-white">
                <option value="Player">Player</option>
                <option value="academy_director">Academy director</option>
                <option value="advisor">Advisor</option>
                <option value="assistant_coach">Assistant coach</option>
                <option value="assistant_team_manager">Assistant team manager</option>
                <option value="assistant_youth_director">Assistant youth director</option>
                <option value="chairman_supervisory_board">Chairman supervisory board</option>
                <option value="chief_executive_officer">Chief executive officer</option>
                <option value="coach">Coach</option>
                <option value="commercial_officer">Commercial officer</option>
                <option value="cooperations_manager">Cooperations manager</option>
                <option value="doctor">Doctor</option>
                <option value="driver">Driver</option>
                <option value="equipment_manager">Equipment manager</option>
                <option value="finance_officer">Finance officer</option>
                <option value="fitness_coach">Fitness coach</option>
                <option value="general_manager">General manager</option>
                <option value="general_secretary">General secretary</option>
                <option value="goalkeeper_coach">Goalkeeper coach</option>
                <option value="interim_coach">Interim coach</option>
                <option value="local_coach">Local coach</option>
                <option value="marketing_officer">Marketing officer</option>
                <option value="match_analyst">Match analyst</option>
                <option value="media_assistant">Media assistant</option>
                <option value="media_officer">Media officer</option>
                <option value="mental_coach">Mental coach</option>
                <option value="physiotherapist">Physiotherapist</option>
                <option value="president">President</option>
                <option value="scout">Scout</option>
                <option value="security_officer">Security officer</option>
                <option value="sporting_ceo">Sporting ceo</option>
                <option value="sporting_director">Sporting director</option>
                <option value="supervisory_board">Supervisory board</option>
                <option value="team_manager">Team manager</option>
                <option value="technical_director">Technical director</option>
                <option value="test_driver">Test driver</option>
                <option value="vice_president">Vice president</option>
                <option value="video_analyst">Video analyst</option>
                <option value="youth_director">Youth director</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Start Date</label>
              <div className="flex gap-2">
                <input type="text" name="startDay" defaultValue={start.day} maxLength={2} placeholder="dd" className="w-12 border border-[#040f4f] p-1.5 text-center" />
                <input type="text" name="startMonth" defaultValue={start.month} maxLength={2} placeholder="mm" className="w-12 border border-[#040f4f] p-1.5 text-center" />
                <input type="text" name="startYear" defaultValue={start.year} maxLength={4} placeholder="yyyy" className="w-20 border border-[#040f4f] p-1.5 text-center" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">End Date</label>
              <div className="flex gap-2">
                <input type="text" name="endDay" defaultValue={end.day} maxLength={2} placeholder="dd" className="w-12 border border-[#040f4f] p-1.5 text-center" />
                <input type="text" name="endMonth" defaultValue={end.month} maxLength={2} placeholder="mm" className="w-12 border border-[#040f4f] p-1.5 text-center" />
                <input type="text" name="endYear" defaultValue={end.year} maxLength={4} placeholder="yyyy" className="w-20 border border-[#040f4f] p-1.5 text-center" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Active</label>
            <div className="flex gap-5">
              <label className="flex items-center gap-1">
                <input type="radio" name="active" value="yes" defaultChecked={membership.isActive} />
                yes
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="active" value="no" defaultChecked={!membership.isActive} />
                no
              </label>
            </div>
          </div>

          <div className="border-t border-[#040f4f] pt-4">
            <button type="submit" className="border border-[#040f4f] bg-[#f4a01c] px-8 py-2 font-bold text-[#040f4f] hover:bg-[#040f4f] hover:text-[#f4a01c]">
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
