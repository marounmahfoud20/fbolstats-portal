"use server";

import { withAdminActivity } from "@/lib/admin-activity";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { isNationalTeamSection, NATIONAL_TEAM_SECTIONS, nationalCompetitionHref } from "@/lib/national-competitions";

export async function createNationalCompetition(formData: FormData) {
  return withAdminActivity("createNationalCompetition", { formData }, async () => {
  if (!getAdminUserFromCookies(await cookies())) throw new Error("Sign in to create a competition.");
  const section = String(formData.get("section") || "");
  const name = String(formData.get("name") || "").trim();
  if (!isNationalTeamSection(section) || !name) throw new Error("Enter a competition name.");
  const type = NATIONAL_TEAM_SECTIONS[section].category;
  const existing = await prisma.league.findFirst({
    where: { footballType: "national", type, competitionName: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  const competition = existing ?? await prisma.league.create({
    data: { competitionName: name, footballType: "national", type },
    select: { id: true },
  });
  revalidatePath(`/admin/national-teams/${section}`);
  redirect(nationalCompetitionHref(section, competition.id));

  });
}
