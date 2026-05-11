"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getAdminUserFromCookies, isGodAdmin } from "@/lib/adminAuth";

function parseCoordinates(input?: string | null): { latitude: string | null; longitude: string | null } {
  const text = (input || "").trim();
  if (!text) return { latitude: null, longitude: null };

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const latitude = Number.parseFloat(m[1]);
      const longitude = Number.parseFloat(m[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude: String(latitude), longitude: String(longitude) };
      }
    }
  }

  return { latitude: null, longitude: null };
}

function normalizeClubColors(input?: string | null): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  const tokens = raw.split(/[,\s/|;]+/).map((x) => x.trim()).filter(Boolean);
  const normalized = tokens
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .filter((t) => /^#[0-9a-fA-F]{6}$/.test(t) || /^#[0-9a-fA-F]{3}$/.test(t));
  return normalized.length > 0 ? normalized.join(", ") : raw;
}

function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyAdminPassword(password: string, storedHash: string): boolean {
  const [salt, existing] = storedHash.split(":");
  if (!salt || !existing) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(existing, "hex");
  const b = Buffer.from(derived, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function ensureAdminAccountTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminAccount" (
      "id" SERIAL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminAccount_username_key"
      ON "AdminAccount" ("username")
  `);
}

async function ensureGodAdminPermission() {
  const cookieStore = await cookies();
  const adminUser = getAdminUserFromCookies(cookieStore);
  if (!isGodAdmin(adminUser)) {
    throw new Error("Forbidden");
  }
}

export async function createLeague(formData: FormData) {
  const competitionName = ((formData.get("competitionName") as string) || "").trim();
  const type = ((formData.get("type") as string) || "").trim();
  const footballTypeRaw = ((formData.get("footballType") as string) || "club").toLowerCase();
  const footballType = footballTypeRaw === "national" ? "national" : "club";
  if (!competitionName || !type) return;

  await prisma.$executeRaw`
    INSERT INTO "League" ("competitionName","type","footballType","createdAt","updatedAt")
    VALUES (${competitionName}, ${type}, ${footballType}, NOW(), NOW())
  `;
  await prisma.$executeRaw`
    INSERT INTO "LeagueCategory" ("name","footballType","createdAt","updatedAt")
    VALUES (${type}, ${footballType}, NOW(), NOW())
    ON CONFLICT ("name","footballType") DO NOTHING
  `;

  revalidatePath("/admin");
}

export async function createCompetitionCategory(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const footballTypeRaw = ((formData.get("footballType") as string) || "club").toLowerCase();
  const footballType = footballTypeRaw === "national" ? "national" : "club";
  if (!name) return;

  // Auto-bootstrap category table for environments where migration hasn't run yet.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LeagueCategory" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "footballType" TEXT NOT NULL DEFAULT 'club',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "LeagueCategory_name_footballType_key"
      ON "LeagueCategory" ("name", "footballType")
  `);

  await prisma.$executeRaw`
    INSERT INTO "LeagueCategory" ("name","footballType","createdAt","updatedAt")
    VALUES (${name}, ${footballType}, NOW(), NOW())
    ON CONFLICT ("name","footballType") DO NOTHING
  `;

  revalidatePath("/admin", "layout");
}

export async function deleteCompetitionCategory(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const footballTypeRaw = ((formData.get("footballType") as string) || "club").toLowerCase();
  const footballType = footballTypeRaw === "national" ? "national" : "club";
  if (!name) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LeagueCategory" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "footballType" TEXT NOT NULL DEFAULT 'club',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "LeagueCategory_name_footballType_key"
      ON "LeagueCategory" ("name", "footballType")
  `);

  await prisma.$executeRaw`
    DELETE FROM "LeagueCategory"
    WHERE "name" = ${name}
      AND "footballType" = ${footballType}
  `;

  revalidatePath("/admin", "layout");
}

export async function createAdminAccount(formData: FormData) {
  await ensureGodAdminPermission();
  await ensureAdminAccountTable();
  const username = ((formData.get("username") as string) || "").trim().toLowerCase();
  const password = ((formData.get("password") as string) || "").trim();
  if (!username || !password) return;

  const passwordHash = hashAdminPassword(password);
  await prisma.$executeRaw`
    INSERT INTO "AdminAccount" ("username", "passwordHash", "isActive", "createdAt", "updatedAt")
    VALUES (${username}, ${passwordHash}, true, NOW(), NOW())
    ON CONFLICT ("username") DO NOTHING
  `;

  revalidatePath("/admin/administrator");
}

export async function updateAdminAccount(formData: FormData) {
  await ensureGodAdminPermission();
  await ensureAdminAccountTable();
  const id = Number.parseInt((formData.get("id") as string) || "", 10);
  const username = ((formData.get("username") as string) || "").trim().toLowerCase();
  const password = ((formData.get("password") as string) || "").trim();
  const isActive = (formData.get("isActive") as string) === "yes";
  if (!Number.isFinite(id) || !username) return;

  if (password) {
    const passwordHash = hashAdminPassword(password);
    await prisma.$executeRaw`
      UPDATE "AdminAccount"
      SET "username" = ${username},
          "passwordHash" = ${passwordHash},
          "isActive" = ${isActive},
          "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "AdminAccount"
      SET "username" = ${username},
          "isActive" = ${isActive},
          "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
  }

  revalidatePath("/admin/administrator");
}

export async function deleteAdminAccount(formData: FormData) {
  await ensureGodAdminPermission();
  await ensureAdminAccountTable();
  const id = Number.parseInt((formData.get("id") as string) || "", 10);
  if (!Number.isFinite(id)) return;

  await prisma.$executeRaw`DELETE FROM "AdminAccount" WHERE "id" = ${id}`;
  revalidatePath("/admin/administrator");
}

export async function verifyAdminAccountCredentials(username: string, password: string): Promise<boolean> {
  await ensureAdminAccountTable();
  const normalized = (username || "").trim().toLowerCase();
  const pwd = (password || "").trim();
  if (!normalized || !pwd) return false;

  const rows = await prisma.$queryRaw<Array<{ passwordHash: string; isActive: boolean }>>`
    SELECT "passwordHash", "isActive"
    FROM "AdminAccount"
    WHERE "username" = ${normalized}
    LIMIT 1
  `;
  const account = rows[0];
  if (!account || !account.isActive) return false;
  return verifyAdminPassword(pwd, account.passwordHash);
}

export async function resetAndSeedDatabase() {
  try {
    console.log("Starting database reset...");

    // We use catch block for relations that might not exist yet during reset
    try { await prisma.match?.deleteMany({}); } catch (e) { }
    try { await prisma.group?.deleteMany({}); } catch (e) { }
    await prisma.season.deleteMany({});
    await prisma.league.deleteMany({});

    console.log("Old data wiped successfully. Injecting official competitions...");

    const officialCompetitions = [
      { competitionName: "Lebanese Men's First Division", type: "Men" },
      { competitionName: "Lebanese Men's Second Division", type: "Men" },
      { competitionName: "Lebanese Men's Third Division", type: "Men" },
      { competitionName: "Lebanese Men's Cup", type: "Men" },
      { competitionName: "Lebanese Men's Super Cup", type: "Men" },
      { competitionName: "Lebanese Men's Elite Cup", type: "Men" },
      { competitionName: "Lebanese Men's Challenge Cup", type: "Men" },
      { competitionName: "Lebanese Men's Federation Cup", type: "Men" },
      { competitionName: "Lebanese Women's League", type: "Women" },
      { competitionName: "Lebanese Women's Cup", type: "Women" },
      { competitionName: "Lebanese Women's Super Cup", type: "Women" },
      { competitionName: "Lebanese Boys' Under-20", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-18", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-17", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-16", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-15", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-14", type: "Youth Boys" },
      { competitionName: "Lebanese Boys' Under-13", type: "Youth Boys" },
      { competitionName: "Lebanese Girls Under-19", type: "Youth Girls" },
      { competitionName: "Lebanese Girls Under-19 Cup", type: "Youth Girls" },
      { competitionName: "Lebanese Girls Under-17", type: "Youth Girls" },
      { competitionName: "Lebanese Girls Under-15", type: "Youth Girls" },
    ];

    await prisma.league.createMany({
      data: officialCompetitions,
    });

    console.log("✅ Database successfully seeded!");
  } catch (error) {
    console.error("❌ ERROR SEEDING DATABASE:", error);
  }

  revalidatePath("/admin");
}

export async function updateLeague(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const competitionName = ((formData.get("competitionName") as string) || "").trim();
  const type = ((formData.get("type") as string) || "").trim();
  const footballTypeRaw = ((formData.get("footballType") as string) || "club").toLowerCase();
  const footballType = footballTypeRaw === "national" ? "national" : "club";
  if (!id || !competitionName || !type) return;

  await prisma.$executeRaw`
    UPDATE "League"
    SET "competitionName" = ${competitionName},
        "type" = ${type},
        "footballType" = ${footballType},
        "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  revalidatePath("/admin", "layout");
}

export async function deleteLeague(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  await prisma.league.delete({
    where: { id: id },
  });

  revalidatePath("/admin", "layout");
}

export async function updateCategory(formData: FormData) {
  const oldType = ((formData.get("oldType") as string) || "").trim();
  const newType = ((formData.get("newType") as string) || "").trim();
  const footballTypeRaw = ((formData.get("footballType") as string) || "club").toLowerCase();
  const footballType = footballTypeRaw === "national" ? "national" : "club";

  if (oldType && newType && oldType !== newType) {
    await prisma.$executeRaw`
      UPDATE "League"
      SET "type" = ${newType},
          "updatedAt" = NOW()
      WHERE "type" = ${oldType}
        AND COALESCE("footballType", 'club') = ${footballType}
    `;
    await prisma.$executeRaw`
      UPDATE "LeagueCategory"
      SET "name" = ${newType},
          "updatedAt" = NOW()
      WHERE "name" = ${oldType}
        AND "footballType" = ${footballType}
    `;

    revalidatePath("/admin", "layout");
  }
}

export async function createSeason(formData: FormData) {
  const leagueId = parseInt(formData.get("leagueId") as string);

  await prisma.season.create({
    data: {
      leagueId: leagueId,
      name: formData.get("title") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
    },
  });

  revalidatePath(`/admin/leagues/${leagueId}`);
  redirect(`/admin/leagues/${leagueId}`);
}

export async function bulkUpdateSeasons(formData: FormData) {
  const leagueId = formData.get("leagueId") as string;
  const ids = formData.getAll("seasonId");
  const titles = formData.getAll("title");
  const startDates = formData.getAll("startDate");
  const endDates = formData.getAll("endDate");

  for (let i = 0; i < ids.length; i++) {
    await prisma.season.update({
      where: { id: parseInt(ids[i] as string) },
      data: {
        name: titles[i] as string,
        startDate: startDates[i] as string,
        endDate: endDates[i] as string,
      },
    });
  }

  revalidatePath(`/admin/leagues/${leagueId}`);
  redirect(`/admin/leagues/${leagueId}`);
}

export async function seedFirstDivisionHistory() {
  const seasonsToCreate = [
    "1987/1988", "1989/1990", "1990/1991", "1991/1992", "1992/1993", "1993/1994", "1994/1995",
    "1995/1996", "1996/1997", "1997/1998", "1998/1999", "2005/2006", "2006/2007", "2020/2021",
    "2024/2025", "2007/2008", "2009/2010", "2010/2011", "2014/2015", "2016/2017", "2017/2018",
    "2018/2019", "2021/2022", "2022/2023", "1972/1973", "1974/1975", "1999/2000", "2001/2002",
    "2003/2004", "2004/2005", "2008/2009", "2013/2014", "2023/2024", "1943/1944", "1945/1946",
    "1947/1948", "1950/1951", "1954/1955", "1962/1963", "1968/1969", "1933/1934", "1941/1942",
    "1942/1943", "1946/1947", "1948/1949", "1944/1945", "1953/1954", "1956/1957", "1960/1961",
    "1934/1935", "1936/1937", "1937/1938", "1935/1936", "1938/1939", "1940/1941", "1955/1956",
    "1964/1965", "1969/1970", "2011/2012", "2012/2013", "2015/2016", "1966/1967", "2002/2003"
  ];

  const league = await prisma.league.findFirst({
    where: { competitionName: "Lebanese Men's First Division" }
  });

  if (!league) return;

  await prisma.season.deleteMany({ where: { leagueId: league.id } });

  const data = seasonsToCreate.map(sName => {
    const [startYear, endYear] = sName.split("/");

    return {
      name: sName,
      leagueId: league.id,
      startDate: `${startYear}-09-01`,
      endDate: `${endYear}-06-30`,
    };
  });

  await prisma.season.createMany({ data });
  revalidatePath(`/admin/leagues/${league.id}`);
}

export async function seedMatchesArchitecture() {
  const league = await prisma.league.findFirst({
    where: { competitionName: "Lebanese Men's First Division" }
  });

  if (!league) return console.log("League not found!");

  const season = await prisma.season.create({
    data: {
      leagueId: league.id,
      name: "2025/2026",
      startDate: "2025-09-01",
      endDate: "2026-06-30"
    }
  });

  const group = await prisma.group.create({
    data: {
      seasonId: season.id,
      name: "Group A"
    }
  });

  const mockMatches = [
    { date: "2025-09-19", time: "14:30", teamA: "Bourj SC", teamB: "Jwaya SC", venue: "Amin Abdelnour Stadium", status: "Played", groupId: group.id },
    { date: "2025-09-19", time: "14:30", teamA: "Shabab Al Sahel SC", teamB: "Al Mabarrah SC", venue: "Al Ahed Stadium", status: "Played", groupId: group.id },
    { date: "2025-09-20", time: "14:30", teamA: "Al Riyadi Al Abbasiyah Club", teamB: "Al Ahed SC", venue: "Abbas Nasser Stadium", status: "Played", groupId: group.id },
  ];

  await prisma.match.createMany({
    data: mockMatches
  });

  console.log("✅ Successfully seeded Season -> Group -> Matches architecture!");
  revalidatePath(`/admin/leagues/${league.id}`);
}

export async function createSingleMatch(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const leagueId = formData.get("leagueId") as string;
  const seasonId = formData.get("seasonId") as string;

  const day = formData.get("day") as string;
  const month = formData.get("month") as string;
  const year = formData.get("year") as string;
  const hour = formData.get("hour") as string;
  const minute = formData.get("minute") as string;

  const date = (day && month && year) ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : null;
  const time = (hour && minute) ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : null;

  await prisma.match.create({
    data: {
      groupId: groupId,
      date: date,
      time: time,
      teamA: formData.get("teamA") as string,
      teamB: formData.get("teamB") as string,
      venue: formData.get("venue") as string,
      status: formData.get("status") as string,
    }
  });

  revalidatePath(`/admin/leagues/${leagueId}/${seasonId}/${groupId}/matches`);
  redirect(`/admin/leagues/${leagueId}/${seasonId}/${groupId}/matches`);
}

export async function createBulkMatches(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const leagueId = formData.get("leagueId") as string;
  const seasonId = formData.get("seasonId") as string;

  const matchesToCreate = [];

  for (let i = 0; i < 60; i++) {
    const teamA = formData.get(`team_a[${i}]`) as string;
    const teamB = formData.get(`team_b[${i}]`) as string;

    if (teamA && teamB) {
      const day = formData.get(`day[${i}]`) as string;
      const month = formData.get(`month[${i}]`) as string;
      const year = formData.get(`year[${i}]`) as string;
      const hour = formData.get(`hour[${i}]`) as string;
      const minute = formData.get(`minute[${i}]`) as string;
      const venue = formData.get(`venue[${i}]`) as string;

      const date = (day && month && year) ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : null;
      const time = (hour && minute) ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : null;

      matchesToCreate.push({
        groupId: groupId,
        date: date,
        time: time,
        teamA: teamA,
        teamB: teamB,
        venue: venue || null,
        status: "Fixture"
      });
    }
  }

  if (matchesToCreate.length > 0) {
    await prisma.match.createMany({
      data: matchesToCreate
    });
  }

  revalidatePath(`/admin/leagues/${leagueId}/${seasonId}/${groupId}/matches`);
  redirect(`/admin/leagues/${leagueId}/${seasonId}/${groupId}/matches`);
}

export async function extendSeasonDate(formData: FormData) {
  const seasonId = parseInt(formData.get("seasonId") as string);
  const daysToAdd = parseInt(formData.get("days") as string);

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season || !season.endDate) return;

  const currentDate = new Date(season.endDate);
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  const newDateString = currentDate.toISOString().split('T')[0];

  await prisma.season.update({
    where: { id: seasonId },
    data: { endDate: newDateString }
  });

  revalidatePath("/admin/tasks");
}

export async function markSeasonFinished(formData: FormData) {
  const seasonId = parseInt(formData.get("seasonId") as string);

  await prisma.season.update({
    where: { id: seasonId },
    data: { isFinished: true }
  });

  revalidatePath("/admin/tasks");
}

export async function createPerson(formData: FormData) {
  const firstName = ((formData.get("firstName") as string) || "").trim();
  const lastName = ((formData.get("lastName") as string) || "").trim();
  const matchName = ((formData.get("matchName") as string) || "").trim();
  const commonName = ((formData.get("commonName") as string) || "").trim();
  const countryOfBirth = ((formData.get("countryOfBirth") as string) || "").trim();
  const nationality = ((formData.get("nationality") as string) || "").trim();

  if (!firstName || !lastName || !matchName || !commonName || !countryOfBirth || !nationality) {
    throw new Error("Some critical data has not ben entered.");
  }

  const dobDay = formData.get("dobDay") as string;
  const dobMonth = formData.get("dobMonth") as string;
  const dobYear = formData.get("dobYear") as string;
  const dob = (dobDay && dobMonth && dobYear) ? `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}` : null;

  const dodDay = formData.get("dodDay") as string;
  const dodMonth = formData.get("dodMonth") as string;
  const dodYear = formData.get("dodYear") as string;
  const dod = (dodDay && dodMonth && dodYear) ? `${dodYear}-${dodMonth.padStart(2, '0')}-${dodDay.padStart(2, '0')}` : null;

  const person = await prisma.person.create({
    data: {
      firstName: firstName || null,
      lastName: lastName || null,
      matchName: matchName || null,
      commonName: commonName || null,
      dob: dob,
      status: formData.get("status") as string || "active",
      dateOfDeath: dod,
      placeOfBirth: formData.get("placeOfBirth") as string || null,
        countryOfBirth: countryOfBirth || null,
        nationality: nationality || null,
        gender: formData.get("gender") as string || null,
        position: formData.get("position") as string || null,
        isReferee: formData.get("referee") as string || "no",
      strongFoot: formData.get("foot") as string || null,
      height: formData.get("height") as string || null,
      weight: formData.get("weight") as string || null,
      nickname: formData.get("nickname") as string || null,
      birthYear: formData.get("birthYear") as string || null,
      mappingSource: formData.get("mappingSource") as string || null,
    }
  });

  revalidatePath("/admin/people");
  redirect(`/admin/people/${person.id}`);
}

export async function updatePerson(formData: FormData) {
  const id = Number.parseInt((formData.get("id") as string) || "", 10);
  if (!Number.isFinite(id)) return;

  const dobDay = formData.get("dobDay") as string;
  const dobMonth = formData.get("dobMonth") as string;
  const dobYear = formData.get("dobYear") as string;
  const dob = (dobDay && dobMonth && dobYear) ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}` : null;

  const dodDay = formData.get("dodDay") as string;
  const dodMonth = formData.get("dodMonth") as string;
  const dodYear = formData.get("dodYear") as string;
  const dod = (dodDay && dodMonth && dodYear) ? `${dodYear}-${dodMonth.padStart(2, "0")}-${dodDay.padStart(2, "0")}` : null;

  await prisma.person.update({
    where: { id },
    data: {
      firstName: (formData.get("firstName") as string) || null,
      lastName: (formData.get("lastName") as string) || null,
      matchName: (formData.get("matchName") as string) || null,
      commonName: (formData.get("commonName") as string) || null,
      dob,
      status: (formData.get("status") as string) || "active",
      dateOfDeath: dod,
      placeOfBirth: (formData.get("placeOfBirth") as string) || null,
      countryOfBirth: (formData.get("countryOfBirth") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      gender: (formData.get("gender") as string) || null,
      position: (formData.get("position") as string) || null,
      isReferee: (formData.get("referee") as string) || "no",
      strongFoot: (formData.get("foot") as string) || null,
      height: (formData.get("height") as string) || null,
      weight: (formData.get("weight") as string) || null,
      nickname: (formData.get("nickname") as string) || null,
      birthYear: (formData.get("birthYear") as string) || null,
      mappingSource: (formData.get("mappingSource") as string) || null,
    },
  });

  revalidatePath(`/admin/people/${id}`);
  revalidatePath("/admin/people");
  redirect(`/admin/people/${id}`);
}

export async function createTeam(formData: FormData) {
  const incomingGender = (formData.get("gender") as string) || "male";
  const gender = incomingGender === "female" ? "female" : "male";
  const addressInput = (formData.get("address") as string) || "";
  const logoStatus = ((formData.get("logoStatus") as string) || "active").toLowerCase() === "retired" ? "retired" : "active";
  const logoStartDate = (formData.get("logoStartDate") as string) || null;
  const logoEndDate = (formData.get("logoEndDate") as string) || null;
  const logoFile = formData.get("logo") as File | null;
  const coords = parseCoordinates(addressInput);

  const team = await prisma.team.create({
    data: {
      name: formData.get("name") as string,
      shortName: formData.get("shortName") as string || null,
      tla: formData.get("tla") as string || null,
      officialName: formData.get("officialName") as string || null,
      area: formData.get("area") as string || null,
      country: formData.get("country") as string || null,
      type: formData.get("type") as string || "club",
      gender,
      status: formData.get("status") as string || "active",
      address: addressInput || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      city: formData.get("city") as string || null,
      url: formData.get("url") as string || null,
      facebookUrl: formData.get("facebookUrl") as string || null,
      instagramUrl: formData.get("instagramUrl") as string || null,
      twitterUrl: formData.get("twitterUrl") as string || null,
      founded: formData.get("founded") as string || null,
      clubColors: normalizeClubColors(formData.get("clubColors") as string) || null,
      nicknames: formData.get("nicknames") as string || null,
    }
  });

  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads", "teams");
    await mkdir(uploadDir, { recursive: true });
    const ext = logoFile.name.split(".").pop() || "png";
    const filename = `${team.id}-${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const logoPath = `/uploads/teams/${filename}`;

    if (logoStatus === "active") {
      await prisma.$executeRaw`UPDATE "TeamLogoHistory" SET "isCurrent" = false, "updatedAt" = NOW() WHERE "teamId" = ${team.id} AND "isCurrent" = true`;
    }

    await prisma.$executeRaw`INSERT INTO "TeamLogoHistory" ("teamId","logoPath","status","startDate","endDate","isCurrent","createdAt","updatedAt")
      VALUES (${team.id}, ${logoPath}, ${logoStatus}, ${logoStartDate}, ${logoEndDate}, ${logoStatus === "active"}, NOW(), NOW())`;

    if (logoStatus === "active") {
      await prisma.team.update({
        where: { id: team.id },
        data: { logo: logoPath }
      });
    }
  }

  revalidatePath("/admin/teams");
  redirect(`/admin/teams/${team.id}`);
}

export async function updateTeam(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const incomingGender = (formData.get("gender") as string) || "male";
  const gender = incomingGender === "female" ? "female" : "male";
  const addressInput = (formData.get("address") as string) || "";
  const coords = parseCoordinates(addressInput);
  const logoStatus = ((formData.get("logoStatus") as string) || "active").toLowerCase() === "retired" ? "retired" : "active";
  const logoStartDate = (formData.get("logoStartDate") as string) || null;
  const logoEndDate = (formData.get("logoEndDate") as string) || null;
  const logoFile = formData.get("logo") as File | null;

  await prisma.team.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      shortName: formData.get("shortName") as string || null,
      tla: formData.get("tla") as string || null,
      officialName: formData.get("officialName") as string || null,
      area: formData.get("area") as string || null,
      country: formData.get("country") as string || null,
      type: formData.get("type") as string || "club",
      gender,
      status: formData.get("status") as string || "active",
      address: addressInput || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      city: formData.get("city") as string || null,
      url: formData.get("url") as string || null,
      facebookUrl: formData.get("facebookUrl") as string || null,
      instagramUrl: formData.get("instagramUrl") as string || null,
      twitterUrl: formData.get("twitterUrl") as string || null,
      founded: formData.get("founded") as string || null,
      clubColors: normalizeClubColors(formData.get("clubColors") as string) || null,
      nicknames: formData.get("nicknames") as string || null,
    }
  });

  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads", "teams");
    await mkdir(uploadDir, { recursive: true });
    const ext = logoFile.name.split(".").pop() || "png";
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const logoPath = `/uploads/teams/${filename}`;

    if (logoStatus === "active") {
      await prisma.$executeRaw`UPDATE "TeamLogoHistory" SET "isCurrent" = false, "updatedAt" = NOW() WHERE "teamId" = ${id} AND "isCurrent" = true`;
    }

    await prisma.$executeRaw`INSERT INTO "TeamLogoHistory" ("teamId","logoPath","status","startDate","endDate","isCurrent","createdAt","updatedAt")
      VALUES (${id}, ${logoPath}, ${logoStatus}, ${logoStartDate}, ${logoEndDate}, ${logoStatus === "active"}, NOW(), NOW())`;

    if (logoStatus === "active") {
      await prisma.team.update({
        where: { id },
        data: { logo: logoPath }
      });
    }
  }

  revalidatePath(`/admin/teams/${id}`);
  redirect(`/admin/teams/${id}`);
}

export async function createClubEntity(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return;

  const addressInput = (formData.get("address") as string) || "";
  const coords = parseCoordinates(addressInput);

  const result = await prisma.$queryRaw<Array<{ id: number }>>`INSERT INTO "ClubEntity"
    ("name","shortName","tla","officialName","area","country","type","status","address","latitude","longitude","city","url","facebookUrl","instagramUrl","twitterUrl","founded","clubColors","nicknames","createdAt","updatedAt")
    VALUES (
      ${name},
      ${(formData.get("shortName") as string) || null},
      ${(formData.get("tla") as string) || null},
      ${(formData.get("officialName") as string) || null},
      ${(formData.get("area") as string) || null},
      ${(formData.get("country") as string) || null},
      ${(formData.get("type") as string) || "club"},
      ${(formData.get("status") as string) || "active"},
      ${addressInput || null},
      ${coords.latitude},
      ${coords.longitude},
      ${(formData.get("city") as string) || null},
      ${(formData.get("url") as string) || null},
      ${(formData.get("facebookUrl") as string) || null},
      ${(formData.get("instagramUrl") as string) || null},
      ${(formData.get("twitterUrl") as string) || null},
      ${(formData.get("founded") as string) || null},
      ${normalizeClubColors(formData.get("clubColors") as string) || null},
      ${(formData.get("nicknames") as string) || null},
      NOW(), NOW()
    ) RETURNING "id"`;

  const clubEntityId = result[0]?.id;
  if (!clubEntityId) return;

  const logoFile = formData.get("logo") as File | null;
  const logoStatus = ((formData.get("logoStatus") as string) || "active").toLowerCase() === "retired" ? "retired" : "active";
  const logoStartDate = (formData.get("logoStartDate") as string) || null;
  const logoEndDate = (formData.get("logoEndDate") as string) || null;
  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads", "clubentity");
    await mkdir(uploadDir, { recursive: true });
    const ext = logoFile.name.split(".").pop() || "png";
    const filename = `${clubEntityId}-${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const logoPath = `/uploads/clubentity/${filename}`;
    await prisma.$executeRaw`UPDATE "ClubEntity" SET "logo" = ${logoPath}, "updatedAt" = NOW() WHERE "id" = ${clubEntityId}`;
    await prisma.$executeRaw`INSERT INTO "ClubEntityLogoHistory" ("clubEntityId","logoPath","status","startDate","endDate","isCurrent","createdAt","updatedAt")
      VALUES (${clubEntityId}, ${logoPath}, ${logoStatus}, ${logoStartDate}, ${logoEndDate}, ${logoStatus === "active"}, NOW(), NOW())`;
  }

  revalidatePath("/admin/clubentity");
  redirect(`/admin/clubentity/${clubEntityId}`);
}

export async function addClubEntityLogoHistory(formData: FormData) {
  const clubEntityId = Number.parseInt((formData.get("clubEntityId") as string) || "", 10);
  if (!clubEntityId) return;
  const logoFile = formData.get("logo") as File | null;
  if (!logoFile || logoFile.size === 0) return;

  const status = ((formData.get("status") as string) || "active").toLowerCase() === "retired" ? "retired" : "active";
  const startDate = (formData.get("startDate") as string) || null;
  const endDate = (formData.get("endDate") as string) || null;

  const bytes = await logoFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = join(process.cwd(), "public", "uploads", "clubentity");
  await mkdir(uploadDir, { recursive: true });
  const ext = logoFile.name.split(".").pop() || "png";
  const filename = `${clubEntityId}-${Date.now()}.${ext}`;
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);
  const logoPath = `/uploads/clubentity/${filename}`;

  if (status === "active") {
    await prisma.$executeRaw`UPDATE "ClubEntityLogoHistory" SET "isCurrent" = false, "updatedAt" = NOW() WHERE "clubEntityId" = ${clubEntityId} AND "isCurrent" = true`;
    await prisma.$executeRaw`UPDATE "ClubEntity" SET "logo" = ${logoPath}, "updatedAt" = NOW() WHERE "id" = ${clubEntityId}`;
  }

  await prisma.$executeRaw`INSERT INTO "ClubEntityLogoHistory" ("clubEntityId","logoPath","status","startDate","endDate","isCurrent","createdAt","updatedAt")
    VALUES (${clubEntityId}, ${logoPath}, ${status}, ${startDate}, ${endDate}, ${status === "active"}, NOW(), NOW())`;

  revalidatePath(`/admin/clubentity/${clubEntityId}`);
  redirect(`/admin/clubentity/${clubEntityId}`);
}

export async function updateClubEntityLogoHistory(formData: FormData) {
  const clubEntityId = Number.parseInt((formData.get("clubEntityId") as string) || "", 10);
  const logoHistoryId = Number.parseInt((formData.get("logoHistoryId") as string) || "", 10);
  if (!clubEntityId || !logoHistoryId) return;

  const status = ((formData.get("status") as string) || "active").toLowerCase() === "retired" ? "retired" : "active";
  const startDate = (formData.get("startDate") as string) || null;
  const endDateRaw = (formData.get("endDate") as string) || null;
  const endDate = status === "active" ? null : endDateRaw;
  const logoFile = formData.get("logo") as File | null;

  let nextLogoPath: string | null = null;
  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads", "clubentity");
    await mkdir(uploadDir, { recursive: true });
    const ext = logoFile.name.split(".").pop() || "png";
    const filename = `${clubEntityId}-${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    nextLogoPath = `/uploads/clubentity/${filename}`;
  }

  await prisma.$executeRaw`UPDATE "ClubEntityLogoHistory"
    SET
      "logoPath" = COALESCE(${nextLogoPath}, "logoPath"),
      "startDate" = ${startDate},
      "endDate" = ${endDate},
      "updatedAt" = NOW()
    WHERE "id" = ${logoHistoryId} AND "clubEntityId" = ${clubEntityId}`;

  const current = await prisma.$queryRaw<Array<{ logoPath: string; isCurrent: boolean }>>`
    SELECT "logoPath","isCurrent" FROM "ClubEntityLogoHistory" WHERE "id" = ${logoHistoryId} AND "clubEntityId" = ${clubEntityId} LIMIT 1`;
  if (current.length > 0 && current[0].isCurrent) {
    await prisma.$executeRaw`UPDATE "ClubEntity" SET "logo" = ${current[0].logoPath}, "updatedAt" = NOW() WHERE "id" = ${clubEntityId}`;
  }

  revalidatePath(`/admin/clubentity/${clubEntityId}`);
  redirect(`/admin/clubentity/${clubEntityId}`);
}

export async function deleteClubEntityLogoHistory(formData: FormData) {
  const clubEntityId = Number.parseInt((formData.get("clubEntityId") as string) || "", 10);
  const logoHistoryId = Number.parseInt((formData.get("logoHistoryId") as string) || "", 10);
  if (!clubEntityId || !logoHistoryId) return;

  const deleted = await prisma.$queryRaw<Array<{ isCurrent: boolean }>>`
    DELETE FROM "ClubEntityLogoHistory"
    WHERE "id" = ${logoHistoryId} AND "clubEntityId" = ${clubEntityId}
    RETURNING "isCurrent"`;

  if (deleted.length > 0 && deleted[0].isCurrent) {
    const nextCurrent = await prisma.$queryRaw<Array<{ logoPath: string }>>`
      SELECT "logoPath"
      FROM "ClubEntityLogoHistory"
      WHERE "clubEntityId" = ${clubEntityId} AND "isCurrent" = true
      ORDER BY "updatedAt" DESC
      LIMIT 1`;

    if (nextCurrent.length > 0) {
      await prisma.$executeRaw`UPDATE "ClubEntity" SET "logo" = ${nextCurrent[0].logoPath}, "updatedAt" = NOW() WHERE "id" = ${clubEntityId}`;
    } else {
      const latest = await prisma.$queryRaw<Array<{ logoPath: string }>>`
        SELECT "logoPath"
        FROM "ClubEntityLogoHistory"
        WHERE "clubEntityId" = ${clubEntityId}
        ORDER BY "updatedAt" DESC
        LIMIT 1`;
      await prisma.$executeRaw`UPDATE "ClubEntity" SET "logo" = ${latest[0]?.logoPath || null}, "updatedAt" = NOW() WHERE "id" = ${clubEntityId}`;
    }
  }

  revalidatePath(`/admin/clubentity/${clubEntityId}`);
  redirect(`/admin/clubentity/${clubEntityId}`);
}

export async function createTeamForClubEntity(formData: FormData) {
  const clubEntityId = Number.parseInt((formData.get("clubEntityId") as string) || "", 10);
  const name = ((formData.get("name") as string) || "").trim();
  const teamCategory = ((formData.get("teamCategory") as string) || "").trim();
  if (!clubEntityId || !name || !teamCategory) return;

  const entity = await prisma.$queryRaw<Array<{
    name: string;
    shortName: string | null;
    tla: string | null;
    area: string | null;
    country: string | null;
    type: string | null;
    status: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    city: string | null;
    url: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    founded: string | null;
    clubColors: string | null;
    nicknames: string | null;
    logo: string | null;
  }>>`SELECT "name","shortName","tla","area","country","type","status","address","latitude","longitude","city","url","facebookUrl","instagramUrl","twitterUrl","founded","clubColors","nicknames","logo"
      FROM "ClubEntity" WHERE "id" = ${clubEntityId} LIMIT 1`;

  const e = entity[0];
  if (!e) return;

  const gender = teamCategory.toLowerCase().includes("women") ? "female" : "male";
  await prisma.$executeRaw`INSERT INTO "Team"
    ("name","shortName","tla","officialName","area","country","type","gender","status","address","latitude","longitude","city","url","facebookUrl","instagramUrl","twitterUrl","founded","clubColors","nicknames","logo","clubEntityId","teamCategory","createdAt","updatedAt")
    VALUES (
      ${e.name},
      ${e.shortName},
      ${e.tla},
      ${name},
      ${e.area},
      ${e.country},
      ${e.type || "club"},
      ${gender},
      ${e.status || "active"},
      ${e.address},
      ${e.latitude},
      ${e.longitude},
      ${e.city},
      ${e.url},
      ${e.facebookUrl},
      ${e.instagramUrl},
      ${e.twitterUrl},
      ${e.founded},
      ${e.clubColors},
      ${e.nicknames},
      ${e.logo},
      ${clubEntityId},
      ${teamCategory},
      NOW(), NOW()
    )`;

  revalidatePath(`/admin/clubentity/${clubEntityId}`);
  revalidatePath("/admin/teams");
  redirect(`/admin/clubentity/${clubEntityId}`);
}

export async function uploadPersonImage(formData: FormData) {
  const file = formData.get('file') as File;
  const personId = formData.get('personId') as string;

  if (!file || !personId) {
    throw new Error('File and personId are required');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'people');

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // ignore
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${personId}.${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  const imagePath = `/uploads/people/${filename}`;

  await prisma.person.update({
    where: { id: parseInt(personId) },
    data: { image: imagePath }
  });

  revalidatePath(`/admin/people/${personId}`);
}

export async function searchTeams(query: string, genderFilter: string = "both") {
  // Don't search if they haven't typed at least 2 letters
  if (!query || query.length < 2) {
    return [];
  }

  const teams = await prisma.team.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
      ...(genderFilter === "male" || genderFilter === "female"
        ? { OR: [{ gender: genderFilter }, { gender: null }] }
        : {})
    },
    take: 10,
    select: {
      id: true,
      name: true,
    },
  });

  return teams;
}

export async function addMembership(formData: FormData) {
  const personId = parseInt(formData.get("personId") as string);
  const teamId = parseInt(formData.get("teamId") as string);
  const role = formData.get("role") as string;
  const active = formData.get("active") === "yes";

  // Format Start Date
  const startDay = formData.get("startDay") as string;
  const startMonth = formData.get("startMonth") as string;
  const startYear = formData.get("startYear") as string;
  const startDate = startYear && startMonth && startDay ? `${startYear}-${startMonth}-${startDay}` : null;

  // Format End Date
  const endDay = formData.get("endDay") as string;
  const endMonth = formData.get("endMonth") as string;
  const endYear = formData.get("endYear") as string;
  const endDate = endYear && endMonth && endDay ? `${endYear}-${endMonth}-${endDay}` : null;

  if (!teamId || !personId) return;

  await prisma.membership.create({
    data: {
      personId,
      teamId,
      role,
      startDate,
      endDate,
      isActive: active
    }
  });

  // ADDED: Clear the cache for BOTH the Person and the Team so they both update instantly!
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath(`/admin/teams/${teamId}`);

  redirect(`/admin/people/${personId}`);
}
export async function bulkUpdateMemberships(formData: FormData) {
  const personId = formData.get("personId") as string;
  const personIdNum = parseInt(personId, 10);
  const membershipIds = formData.getAll("membershipId"); // Gets all the hidden IDs from the form loop
  const touchedTeamIds = new Set<number>();

  for (const idStr of membershipIds) {
    const id = parseInt(idStr as string);
    const role = formData.get(`role_${id}`) as string;
    const active = formData.get(`active_${id}`) === "yes";

    // Reconstruct Start Date
    const sDay = formData.get(`startDay_${id}`) as string;
    const sMonth = formData.get(`startMonth_${id}`) as string;
    const sYear = formData.get(`startYear_${id}`) as string;
    const startDate = (sDay && sMonth && sYear) ? `${sYear}-${sMonth.padStart(2, '0')}-${sDay.padStart(2, '0')}` : null;

    // Reconstruct End Date
    const eDay = formData.get(`endDay_${id}`) as string;
    const eMonth = formData.get(`endMonth_${id}`) as string;
    const eYear = formData.get(`endYear_${id}`) as string;
    const endDate = (eDay && eMonth && eYear) ? `${eYear}-${eMonth.padStart(2, '0')}-${eDay.padStart(2, '0')}` : null;

    // Update the database record
    await prisma.membership.update({
      where: { id },
      data: {
        role,
        isActive: active,
        startDate,
        endDate
      }
    });

    // Also clear the cache for the specific team this membership belongs to!
    const membership = await prisma.membership.findUnique({ where: { id } });
    if (membership?.teamId) {
      touchedTeamIds.add(membership.teamId);
    }
  }

  const newRowCount = parseInt((formData.get("newRowCount") as string) || "0", 10);
  for (let i = 0; i < newRowCount; i++) {
    const teamIdRaw = (formData.get(`new_teamId_${i}`) as string) || "";
    const teamId = parseInt(teamIdRaw, 10);
    if (!Number.isFinite(teamId)) continue;

    const role = ((formData.get(`new_role_${i}`) as string) || "Player").trim() || "Player";
    const active = (formData.get(`new_active_${i}`) as string) !== "no";

    const sDay = ((formData.get(`new_startDay_${i}`) as string) || "").trim();
    const sMonth = ((formData.get(`new_startMonth_${i}`) as string) || "").trim();
    const sYear = ((formData.get(`new_startYear_${i}`) as string) || "").trim();
    const startDate = (sDay && sMonth && sYear)
      ? `${sYear}-${sMonth.padStart(2, "0")}-${sDay.padStart(2, "0")}`
      : null;

    const eDay = ((formData.get(`new_endDay_${i}`) as string) || "").trim();
    const eMonth = ((formData.get(`new_endMonth_${i}`) as string) || "").trim();
    const eYear = ((formData.get(`new_endYear_${i}`) as string) || "").trim();
    const endDate = (eDay && eMonth && eYear)
      ? `${eYear}-${eMonth.padStart(2, "0")}-${eDay.padStart(2, "0")}`
      : null;

    await prisma.membership.create({
      data: {
        personId: personIdNum,
        teamId,
        role,
        startDate,
        endDate,
        isActive: active,
      },
    });

    touchedTeamIds.add(teamId);
  }

  for (const teamId of touchedTeamIds) {
    revalidatePath(`/admin/teams/${teamId}`);
  }

  // Clear the person's cache and send them back to the profile
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath(`/admin/people/${personId}/memberships/edit-all`);
  redirect(`/admin/people/${personId}`);
}

export async function updateMembership(formData: FormData) {
  const membershipId = parseInt(formData.get("membershipId") as string);
  const personId = parseInt(formData.get("personId") as string);
  const teamId = parseInt(formData.get("teamId") as string);
  const role = (formData.get("role") as string) || "Player";
  const active = (formData.get("active") as string) === "yes";

  if (!membershipId || !personId || !teamId) return;

  const startDay = (formData.get("startDay") as string) || "";
  const startMonth = (formData.get("startMonth") as string) || "";
  const startYear = (formData.get("startYear") as string) || "";
  const endDay = (formData.get("endDay") as string) || "";
  const endMonth = (formData.get("endMonth") as string) || "";
  const endYear = (formData.get("endYear") as string) || "";

  const startDate = (startDay && startMonth && startYear)
    ? `${startYear}-${startMonth.padStart(2, "0")}-${startDay.padStart(2, "0")}`
    : null;
  const endDate = (endDay && endMonth && endYear)
    ? `${endYear}-${endMonth.padStart(2, "0")}-${endDay.padStart(2, "0")}`
    : null;

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      teamId,
      role,
      isActive: active,
      startDate,
      endDate,
    },
  });

  revalidatePath(`/admin/people/${personId}`);
  revalidatePath(`/admin/people/${personId}/membership/${membershipId}`);
  redirect(`/admin/people/${personId}`);
}
export async function addMultipleClubPlayers(teamId: number, formData: FormData) {
  const parsedTeamId = typeof teamId === 'string' ? parseInt(teamId) : teamId;

  // We loop through the form data and create them one by one so we can create the Membership relation simultaneously
  for (let i = 0; i < 50; i++) {
    const firstName = formData.get(`firstname[${i}]`) as string;
    const lastName = formData.get(`lastname[${i}]`) as string;

    if (!firstName && !lastName) continue;

    const dobDay = formData.get(`date_of_birth_day[${i}]`) as string;
    const dobMonth = formData.get(`date_of_birth_month[${i}]`) as string;
    const dobYear = formData.get(`date_of_birth_year[${i}]`) as string;
    const dob = (dobDay && dobMonth && dobYear) ? `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}` : null;

    const startDay = formData.get(`start_date_day[${i}]`) as string;
    const startMonth = formData.get(`start_date_month[${i}]`) as string;
    const startYear = formData.get(`start_date_year[${i}]`) as string;
    const teamStartDate = (startDay && startMonth && startYear) ? `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}` : null;

    const endDay = formData.get(`end_date_day[${i}]`) as string;
    const endMonth = formData.get(`end_date_month[${i}]`) as string;
    const endYear = formData.get(`end_date_year[${i}]`) as string;
    const teamEndDate = (endDay && endMonth && endYear) ? `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}` : null;

    // Smart Rule: If there is no end date, the membership is active. If there is an end date, it is inactive.
    const isMembershipActive = !teamEndDate;

    await prisma.person.create({
      data: {
        firstName,
        lastName,
        matchName: formData.get(`matchname[${i}]`) as string || null,
        commonName: formData.get(`commonname[${i}]`) as string || null,
        dob,
        gender: formData.get(`gender[${i}]`) as string || null,
        status: formData.get(`status[${i}]`) as string || "active",
        placeOfBirth: formData.get(`place_of_birth[${i}]`) as string || null,
        countryOfBirth: formData.get(`country_of_birth[${i}]`) as string || null,
        nationality: formData.get(`nationality[${i}]`) as string || null,
        position: formData.get(`position[${i}]`) as string || null,
        strongFoot: formData.get(`foot[${i}]`) as string || null,
        height: formData.get(`height[${i}]`) as string || null,
        weight: formData.get(`weight[${i}]`) as string || null,
        // Legacy direct connections (kept for backwards compatibility)
        teamId: parsedTeamId,
        teamStartDate: teamStartDate,
        teamEndDate: teamEndDate,
        // NEW: Create the precise Membership record that the Team Page actually reads from
        memberships: {
          create: {
            teamId: parsedTeamId,
            role: "Player",
            startDate: teamStartDate,
            endDate: teamEndDate,
            isActive: isMembershipActive
          }
        }
      }
    });
  }

  revalidatePath(`/admin/teams/${parsedTeamId}`);
  redirect(`/admin/teams/${parsedTeamId}`);
}
export async function addTeamToSeason(formData: FormData) {
  const seasonId = parseInt(formData.get("seasonId") as string);
  const teamId = parseInt(formData.get("teamId") as string);

  if (!seasonId || !teamId) return;

  try {
    // Creates the bridge record linking the Team to the Season
    await prisma.seasonTeam.create({
      data: {
        seasonId,
        teamId
      }
    });
  } catch (error) {
    // If the team is already in the season, the unique constraint will throw an error. 
    // We catch it here silently so the app doesn't crash if you double-click.
    console.log("Team is already in this season.");
  }

  revalidatePath(`/admin/seasons/${seasonId}`);
}
export async function addMatchToRound(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const teamA = formData.get("teamA") as string;
  const teamB = formData.get("teamB") as string;

  // Using standard HTML5 date/time pickers makes this much cleaner!
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const venue = formData.get("venue") as string;

  if (!groupId || !teamA || !teamB) return;

  await prisma.match.create({
    data: {
      groupId: groupId,
      teamA: teamA,
      teamB: teamB,
      date: date || null,
      time: time || null,
      venue: venue || null,
      status: "Fixture", // Default starting status
    }
  });

  // Instantly refresh the specific Round page
  revalidatePath(`/admin/rounds/${groupId}`);
}
export async function addGroupToSeason(formData: FormData) {
  const seasonId = parseInt(formData.get("seasonId") as string);
  const name = formData.get("name") as string;

  if (!seasonId || !name) return;

  await prisma.group.create({
    data: {
      seasonId,
      name
    }
  });

  revalidatePath(`/admin/seasons/${seasonId}`);
}
export async function addTeamToRound(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  const teamId = parseInt(formData.get("teamId") as string);

  if (!groupId || !teamId) return;

  try {
    await prisma.groupTeam.create({
      data: {
        groupId,
        teamId
      }
    });
  } catch (error) {
    console.log("Team is already in this round.");
  }

  revalidatePath(`/admin/rounds/${groupId}`);
}

export async function addHistoricalPlayers(formData: FormData) {
  const teamId = parseInt(formData.get("teamId") as string);
  if (!teamId) return;

  for (let i = 0; i < 30; i++) {
    const firstName = (formData.get(`firstName_${i}`) as string) || "";
    const lastName = (formData.get(`lastName_${i}`) as string) || "";
    if (!firstName.trim() && !lastName.trim()) continue;

    const startDay = formData.get(`startDay_${i}`) as string;
    const startMonth = formData.get(`startMonth_${i}`) as string;
    const startYear = formData.get(`startYear_${i}`) as string;
    const startDate = (startDay && startMonth && startYear)
      ? `${startYear}-${startMonth.padStart(2, "0")}-${startDay.padStart(2, "0")}`
      : null;

    const endDay = formData.get(`endDay_${i}`) as string;
    const endMonth = formData.get(`endMonth_${i}`) as string;
    const endYear = formData.get(`endYear_${i}`) as string;
    const endDate = (endDay && endMonth && endYear)
      ? `${endYear}-${endMonth.padStart(2, "0")}-${endDay.padStart(2, "0")}`
      : null;

    await prisma.person.create({
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        matchName: (formData.get(`matchName_${i}`) as string) || null,
        commonName: (formData.get(`commonName_${i}`) as string) || null,
        position: (formData.get(`position_${i}`) as string) || null,
        nationality: (formData.get(`nationality_${i}`) as string) || null,
        memberships: {
          create: {
            teamId,
            role: "Player",
            startDate,
            endDate,
            isActive: false
          }
        }
      }
    });
  }

  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}

export async function bulkUpdateActivePlayers(formData: FormData) {
  const teamId = parseInt(formData.get("teamId") as string);
  if (!teamId) return;

  const membershipIds = formData.getAll("membershipId");
  for (const idStr of membershipIds) {
    const membershipId = parseInt(idStr as string);
    if (!membershipId) continue;

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { personId: true }
    });
    if (!membership) continue;

    const startDay = formData.get(`startDay_${membershipId}`) as string;
    const startMonth = formData.get(`startMonth_${membershipId}`) as string;
    const startYear = formData.get(`startYear_${membershipId}`) as string;
    const startDate = (startDay && startMonth && startYear)
      ? `${startYear}-${startMonth.padStart(2, "0")}-${startDay.padStart(2, "0")}`
      : null;

    await prisma.person.update({
      where: { id: membership.personId },
      data: {
        firstName: ((formData.get(`firstName_${membershipId}`) as string) || null),
        lastName: ((formData.get(`lastName_${membershipId}`) as string) || null),
        matchName: ((formData.get(`matchName_${membershipId}`) as string) || null),
        commonName: ((formData.get(`commonName_${membershipId}`) as string) || null),
        position: ((formData.get(`position_${membershipId}`) as string) || null),
        nationality: ((formData.get(`nationality_${membershipId}`) as string) || null),
      }
    });

    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        startDate,
        isActive: true,
        endDate: null
      }
    });
  }

  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}

export async function exitTeamPlayers(formData: FormData) {
  const teamId = parseInt(formData.get("teamId") as string);
  if (!teamId) return;

  const exitMembershipIds = formData.getAll("exitMembershipId");
  const now = new Date();
  const fallbackDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  for (const idStr of exitMembershipIds) {
    const membershipId = parseInt(idStr as string);
    if (!membershipId) continue;

    const endDay = formData.get(`endDay_${membershipId}`) as string;
    const endMonth = formData.get(`endMonth_${membershipId}`) as string;
    const endYear = formData.get(`endYear_${membershipId}`) as string;
    const endDate = (endDay && endMonth && endYear)
      ? `${endYear}-${endMonth.padStart(2, "0")}-${endDay.padStart(2, "0")}`
      : fallbackDate;

    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        isActive: false,
        endDate
      }
    });
  }

  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}

export async function updateSeasonSettings(formData: FormData) {
  const seasonId = parseInt(formData.get("seasonId") as string);
  const leagueId = parseInt(formData.get("leagueId") as string);
  if (!seasonId || !leagueId) return;

  const seasonTitle = (formData.get("seasonTitle") as string) || "";
  const seasonStartDate = (formData.get("seasonStartDate") as string) || "";
  const seasonEndDate = (formData.get("seasonEndDate") as string) || "";
  const seasonCompName = (formData.get("seasonCompName") as string) || "";

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      name: seasonTitle,
      startDate: seasonStartDate || null,
      endDate: seasonEndDate || null
    }
  });

  if (seasonCompName.trim()) {
    await prisma.league.update({
      where: { id: leagueId },
      data: { competitionName: seasonCompName.trim() }
    });
  }

  revalidatePath(`/admin/seasons/${seasonId}`);
  revalidatePath(`/admin/seasons/${seasonId}/settings`);
  revalidatePath(`/admin/leagues/${leagueId}`);
  redirect(`/admin/seasons/${seasonId}`);
}
