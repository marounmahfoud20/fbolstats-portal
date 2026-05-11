const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error('DIRECT_URL is not set in environment variables.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  }
});

async function main() {
  try {
    const teams = await prisma.team.findMany({ take: 1 });
    console.log("Connection to DIRECT_URL successful!");
    console.log(teams);
  } catch (e) {
    console.error("Connection failed:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
