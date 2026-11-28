"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { nationalTeamOptions, nationalTeamViewForAge, type NationalTeamViewDetails } from "@/lib/national-competitions";

export default function NationalTeamNavigation({ view }: { view: NationalTeamViewDetails }) {
  const router = useRouter();
  const options = nationalTeamOptions(view.gender);
  const selected = options.some(option => option.value === view.id) ? view.id : "";
  return (
    <nav aria-label="National teams" className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex gap-2">
        {(["men", "women"] as const).map(gender => {
          const sameGender = gender === view.gender;
          const destination = nationalTeamViewForAge(gender, view.age);
          const target = sameGender ? view.id : nationalTeamOptions(gender).find(option => option.value === destination)?.value ?? gender;
          return (
            <Link
              key={gender}
              href={`/admin/national-teams/${target}`}
              aria-current={sameGender ? "page" : undefined}
              className={`border border-[#040f4f] px-4 py-1.5 font-bold ${sameGender ? "bg-[#f4a01c]" : "bg-white hover:bg-[#f2f2f2]"}`}
            >
              {gender === "men" ? "Men" : "Women"}
            </Link>
          );
        })}
      </div>
      <label className="flex items-center gap-2 font-bold">
        National team
        <select
          aria-label="National team age group"
          value={selected}
          onChange={event => router.push(`/admin/national-teams/${event.target.value}`)}
          className="border border-[#040f4f] bg-white px-3 py-1.5 text-[#040f4f]"
        >
          {!selected && <option value="" disabled hidden>Select national team</option>}
          {options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </nav>
  );
}
