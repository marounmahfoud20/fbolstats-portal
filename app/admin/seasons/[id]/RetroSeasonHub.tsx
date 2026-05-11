"use client";

import Link from "next/link";
import { useState } from "react";
import { addTeamToSeason, addGroupToSeason } from "@/lib/actions";
import TeamAutocomplete from "@/components/TeamAutocomplete";

export default function RetroSeasonHub({ season }: { season: any }) {
  const isWomenLeague = season.league?.type?.includes("Women") || season.league?.type?.includes("Girls");
  const genderIcon = isWomenLeague ? "♀" : "♂";
  const teamGenderFilter = isWomenLeague ? "female" : "male";

  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isAddingRound, setIsAddingRound] = useState(false);

  const seasonTeams = season.teams || [];
  const seasonGroups = season.groups || [];

  return (
    <div className="text-[#040f4f] pb-20 font-sans text-[11px]">

      {/* ---------------- BREADCRUMB HEADER ---------------- */}
      <div className="w-[980px] mx-auto flex items-center text-[#f4a01c] font-bold text-lg mb-6">
        <span className="mr-2">⚽</span>
        <span className="mr-2">{genderIcon}</span>
        <span className="hover:underline cursor-pointer">
          {season.league?.competitionName} {season.name}
        </span>
      </div>

      {/* ---------------- ROUNDS ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center h-[28px] mt-6 px-3">
        <span className="w-full font-bold text-[#040f4f] uppercase tracking-wider">Rounds ({seasonGroups.length})</span>
        <span
          onClick={() => setIsAddingRound(!isAddingRound)}
          className="text-[#f4a01c] font-bold text-lg cursor-pointer hover:opacity-70 pb-1 select-none"
        >
          {isAddingRound ? "−" : "+"}
        </span>
      </div>

      {/* The Hidden "Add Round" Form */}
      {isAddingRound && (
        <div className="w-[980px] mx-auto bg-[#f9f9f9] border-x border-[#040f4f] p-4 flex justify-center items-center gap-4">
          <span className="font-bold text-[#f4a01c]">Add Round:</span>
          <form action={addGroupToSeason} className="flex gap-2">
            <input type="hidden" name="seasonId" value={season.id} />
            <input
              type="text"
              name="name"
              placeholder="e.g. Regular Season, Group A, Play-offs"
              className="px-2 py-1 text-[#040f4f] outline-none border border-[#040f4f] w-64"
              required
            />
            <button type="submit" className="bg-[#f4a01c] text-white font-bold px-6 py-1 hover:bg-[#040f4f] transition-colors">
              Create Round
            </button>
          </form>
        </div>
      )}

      <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-6 border-collapse bg-white">
        <thead>
          <tr className="bg-[#f2f2f2] text-[#040f4f] h-8 border-b border-[#040f4f]">
            <th className="w-24 pl-2 text-left">ID</th>
            <th className="w-20 text-left">Gender</th>
            <th className="w-20 text-left">AgeG</th>
            <th className="text-left">Round Name</th>
            <th className="w-24 text-left">Start Date</th>
            <th className="w-24 text-left">End Date</th>
            <th className="w-16 text-center">Match #</th>
          </tr>
        </thead>
        <tbody>
          {seasonGroups.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-6 text-gray-500 font-bold">
                No rounds created yet. Click the + button above to add one!
              </td>
            </tr>
          ) : (
            seasonGroups.map((group: any) => (
              <tr key={group.id} className="h-10 border-b border-gray-200 hover:bg-gray-50">
                <td className="pl-2 flex items-center h-10 gap-2">
                  <span className="text-gray-400 cursor-pointer text-[14px]">⚙</span>
                  <Link href={`/admin/rounds/${group.id}`} className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-mono">
                    {group.id}
                  </Link>
                </td>
                <td>{isWomenLeague ? "Female" : "Male"}</td>
                <td>Senior</td>
                <td className="font-bold">{group.name}</td>
                <td className="text-gray-600">{season.startDate || "-"}</td>
                <td className="text-gray-600">{season.endDate || "-"}</td>
                <td className="text-center font-bold text-gray-400">-</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ---------------- VENUES, REFEREES, WINNER ---------------- */}
      {[
        { title: "Season Venues (9)", link: "#" },
        { title: "Season Referees (44)", link: "#" },
        { title: "Season Winner", link: "#" },
      ].map((section, idx) => (
        <div key={idx} className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-lg flex items-center h-[28px] mt-4 px-3">
          <span className="w-full font-bold text-[#040f4f] uppercase tracking-wider">{section.title}</span>
          <span className="text-[#f4a01c] font-bold text-lg cursor-pointer hover:opacity-70">+</span>
        </div>
      ))}

      {/* ---------------- PLAYER RANKINGS ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center h-[28px] mt-8 px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">Player Rankings</span>
      </div>
      <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-6 border-collapse bg-white">
        <tbody>
          {[
  { label: "Goalscorers", slug: "goalscorers" },
  { label: "Own Goals", slug: "own-goals" },
  { label: "Clean Sheets", slug: "clean-sheets" },
  { label: "Bookings", slug: "bookings" },
  { label: "Assists", slug: "assists" },
].map((stat, idx) => (
  <tr key={idx} className="h-8 border-b border-gray-200 hover:bg-gray-50">
              <td className="w-10 text-center">
                <Link
                  href={`/admin/seasons/${season.id}/player-rankings/${stat.slug}`}
                  className="text-gray-400 text-[14px] hover:text-[#040f4f] transition-colors"
                  title={`View ${stat.label}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="inline-block"
                    aria-hidden="true"
                  >
                    <path d="M5 6h4v14H5z" />
                    <path d="M15 6h4v14h-4z" />
                    <path d="M9 9h6" />
                    <path d="M9 15h6" />
                    <circle cx="7" cy="20" r="2" />
                    <circle cx="17" cy="20" r="2" />
                  </svg>
                </Link>
              </td>
    <td className="font-bold text-gray-700">
      <Link
        href={`/admin/seasons/${season.id}/player-rankings/${stat.slug}`}
        className="hover:text-[#040f4f] hover:underline"
      >
        {stat.label}
      </Link>
    </td>
  </tr>
))}
        </tbody>
      </table>

      {/* ---------------- PLAYER DETAILS MONITOR ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-lg flex items-center justify-between h-[28px] mt-4 px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">Player Details Monitor</span>
        <Link
          href={`/admin/seasons/${season.id}/player-details-monitor`}
          className="text-[#f4a01c] font-bold text-xs hover:underline"
        >
          Open
        </Link>
      </div>

      {/* ---------------- SEASON TEAMS ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center justify-between h-[28px] mt-6 px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">
          Season Teams ({seasonTeams.length})
          <span className="ml-4 text-gray-400 cursor-pointer text-[14px]">⚙</span>
          <span className="ml-2 text-gray-400 cursor-pointer text-[14px]">👕</span>
          <span className="ml-2 font-black text-gray-400 cursor-pointer hover:underline">B</span>
        </span>
        <span
          onClick={() => setIsAddingTeam(!isAddingTeam)}
          className="text-[#f4a01c] font-bold text-lg cursor-pointer hover:opacity-70 pb-1 select-none"
        >
          {isAddingTeam ? "−" : "+"}
        </span>
      </div>

      {/* The Smart "Add Team" Form */}
      {isAddingTeam && (
        <div className="w-[980px] mx-auto bg-[#f9f9f9] border-x border-[#040f4f] p-4 flex justify-center items-center gap-4">
          <span className="font-bold text-[#f4a01c]">Add Team:</span>
          <form action={addTeamToSeason} className="flex gap-2 items-start">
            <input type="hidden" name="seasonId" value={season.id} />
            <div className="w-80 text-[#040f4f]">
              <TeamAutocomplete gender={teamGenderFilter} />
            </div>
            <button type="submit" className="bg-[#f4a01c] text-white font-bold px-6 py-1.5 hover:bg-[#040f4f] transition-colors h-[34px]">
              Link Team to Season
            </button>
          </form>
        </div>
      )}

      <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-6 border-collapse bg-white">
        <thead className="bg-[#f2f2f2] text-[#040f4f] h-8 border-b border-[#040f4f] text-left">
          <tr>
            <th className="w-8"></th>
            <th className="w-8"></th>
            <th className="w-8"></th>
            <th className="w-16">ID</th>
            <th className="w-48">Team Name</th>
            <th className="w-32">Short Name</th>
            <th className="w-16">Abbr</th>
            <th className="w-16">Est.</th>
            <th className="w-32">City</th>
            <th>Full Name</th>
          </tr>
        </thead>
        <tbody>
          {seasonTeams.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-6 text-gray-500 font-bold">
                No teams have been added to this season yet. Click the + button above to add one!
              </td>
            </tr>
          ) : (
            seasonTeams.map((st: any) => {
              const team = st.team;
              return (
                <tr key={team.id} className="h-8 border-b border-gray-200 hover:bg-gray-50">
                  <td className="text-center text-gray-400 cursor-pointer text-[14px]">⚙</td>
                  <td className="text-center text-gray-400 cursor-pointer text-[14px]">👕</td>
                  <td className="text-center text-gray-400">{genderIcon}</td>
                  <td className="text-blue-600 hover:underline cursor-pointer font-mono">
                    <Link href={`/admin/teams/${team.id}`}>{team.id}</Link>
                  </td>
                  <td className="font-bold text-[#040f4f]">{team.name}</td>
                  <td className="text-gray-600">{team.shortName || "-"}</td>
                  <td className="text-gray-600">{team.tla || "-"}</td>
                  <td className="text-gray-600">{team.founded || "-"}</td>
                  <td className="text-gray-600">{team.city || "-"}</td>
                  <td className="text-gray-500">{team.officialName || team.name}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

    </div>
  );
}
