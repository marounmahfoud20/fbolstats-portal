import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma2 = globalThis as unknown as {
  prisma2: ReturnType<typeof prismaClientSingleton> | undefined;
};

const prisma = globalForPrisma2.prisma2 ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = prisma;