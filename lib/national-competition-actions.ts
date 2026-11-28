"use server";

import { withAdminActivity } from "@/lib/admin-activity";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { getNationalTeamView, isNationalTeamSection, NATIONAL_TEAM_SECTIONS, nationalCompetitionHref, nationalTeamViewForAge } from "@/lib/national-competitions";

export async function createNationalCompetition(formData: FormData) {
  return withAdminActivity("createNationalCompetition", { formData }, async () => {
  if (!getAdminUserFromCookies(await cookies())) throw new Error("Sign in to create a competition.");
  const section = String(formData.get("section") || "");
  const name = String(formData.get("name") || "").trim();
  if (!isNationalTeamSection(section) || !name) throw new Error("Enter a competition name.");
  const { category: type, gender, age } = NATIONAL_TEAM_SECTIONS[section];
  const requestedView = formData.get("view");
  const view = requestedView ? getNationalTeamView(String(requestedView)) : null;
  if (requestedView && !view?.sections.includes(section)) throw new Error("Select an age group listed on this page.");
  const existing = await prisma.league.findFirst({
    where: { footballType: "national", type, competitionName: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  const competition = existing ?? await prisma.league.create({
    data: { competitionName: name, footballType: "national", type },
    select: { id: true },
  });
  revalidatePath(`/admin/national-teams/${section}`);
  const grouped = nationalTeamViewForAge(gender, age);
  if (grouped !== section) revalidatePath(`/admin/national-teams/${grouped}`);
  redirect(nationalCompetitionHref(view?.id ?? section, competition.id));

  });
}
