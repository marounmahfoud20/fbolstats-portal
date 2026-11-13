import { Prisma } from "@prisma/client";

export function isDatabaseConnectionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1001", "P1002", "P1017"].includes(error.code))
  );
}

// Only retry reads: retrying a write can apply the same change twice.
export async function retryDatabaseRead<T>(read: () => PromiseLike<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return await read();
  }
}
