import prisma from "@/lib/prisma";

type MembershipInput = {
  personId: number;
  teamId: number;
  role: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export async function createMembershipIfMissing(data: MembershipInput) {
  return prisma.$transaction(async (tx) => {
    // Serialize additions for this person so simultaneous submissions cannot
    // both check for a missing stint and then insert the same membership.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(19764321, ${data.personId}::integer)`;
    const existing = await tx.membership.findFirst({ where: data });
    return existing ?? await tx.membership.create({ data });
  }, { timeout: 15000 });
}
