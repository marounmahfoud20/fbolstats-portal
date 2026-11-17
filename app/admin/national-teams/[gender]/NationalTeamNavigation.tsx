"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NATIONAL_TEAM_AGES, NATIONAL_TEAM_SECTIONS, type NationalTeamSection } from "@/lib/national-competitions";

export default function NationalTeamNavigation({ section }: { section: NationalTeamSection }) {
  const router = useRouter();
  const current = NATIONAL_TEAM_SECTIONS[section];
  return (
    <nav aria-label="National teams" className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex gap-2">
        {(["men", "women"] as const).map(gender => (
          <Link
            key={gender}
            href={`/admin/national-teams/${gender}${current.age ? `-u${current.age}` : ""}`}
            aria-current={gender === current.gender ? "page" : undefined}
            className={`border border-[#040f4f] px-4 py-1.5 font-bold ${gender === current.gender ? "bg-[#f4a01c]" : "bg-white hover:bg-[#f2f2f2]"}`}
          >
            {gender === "men" ? "Men" : "Women"}
          </Link>
        ))}
      </div>
      <label className="flex items-center gap-2 font-bold">
        National team
        <select
          aria-label="National team age group"
          value={current.age ?? "senior"}
          onChange={event => router.push(`/admin/national-teams/${current.gender}${event.target.value === "senior" ? "" : `-u${event.target.value}`}`)}
          className="border border-[#040f4f] bg-white px-3 py-1.5 text-[#040f4f]"
        >
          <option value="senior">Senior</option>
          {NATIONAL_TEAM_AGES.map(age => <option key={age} value={age}>U{age}</option>)}
        </select>
      </label>
    </nav>
  );
}
