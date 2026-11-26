import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type MembershipInput = {
  personId: number;
  teamId: number;
  role: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export async function createMembershipIfMissing(data: MembershipInput, transaction?: Prisma.TransactionClient) {
  const create = async (tx: Prisma.TransactionClient) => {
    // Serialize additions for this person so simultaneous submissions cannot
    // both check for a missing stint and then insert the same membership.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(19764321, ${data.personId}::integer)`;
    const existing = await tx.membership.findFirst({ where: data });
    return existing ?? await tx.membership.create({ data });
  };
  return transaction ? create(transaction) : prisma.$transaction(create, { timeout: 15000 });
}
