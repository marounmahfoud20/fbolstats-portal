const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const teams = await prisma.team.findMany({ take: 1 });
    console.log("Connection successful!");
    console.log(teams);
  } catch (e) {
    console.error("Connection failed:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
