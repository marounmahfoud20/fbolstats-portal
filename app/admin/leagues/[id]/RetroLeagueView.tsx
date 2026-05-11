"use client";

import { useState } from "react";
import Link from "next/link";

export default function RetroLeagueView({ league }: { league: any }) {
  const [showHistorical, setShowHistorical] = useState(false);
  const isWomenOrGirls = league.type.includes("Women") || league.type.includes("Girls");

  const currentSeason = league.seasons?.length > 0 ? league.seasons[0] : null;
  const historicalSeasons = league.seasons?.length > 1 ? league.seasons.slice(1) : [];

  return (
    <div className="min-h-screen bg-white text-[#040f4f] py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-8">
        <h1 className="text-3xl font-bold text-[#040f4f] mb-2">{league.competitionName}</h1>
        <span className="bg-[#f4a01c]/10 text-[#f4a01c] px-3 py-1 rounded text-xs uppercase tracking-wider font-bold border border-[#f4a01c]/30">
          {league.type}
        </span>
      </div>

      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center justify-between h-[40px] px-4">
        <span className="font-bold text-[#040f4f] text-sm uppercase tracking-wider">Current Season</span>
        <span className="flex items-center gap-3">
          <Link
            href={`/admin/leagues/${league.id}/add-season`}
            className="text-[#f4a01c] hover:text-[#040f4f] font-bold text-2xl leading-none transition-colors"
            title="Add New Season"
          >
            +
          </Link>
          <Link
            href={`/admin/leagues/${league.id}/edit-seasons`}
            className="bg-[#f4a01c] text-[#040f4f] font-bold text-[11px] px-2 py-1 rounded hover:bg-white transition-colors"
            title="Manage Multiple Seasons"
          >
            M
          </Link>
        </span>
      </div>

      <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-10 text-left border-collapse bg-white">
        <thead className="bg-[#f2f2f2] text-[#040f4f]">
          <tr className="border-b border-[#040f4f] h-10">
            <th className="w-8 text-center"></th>
            <th className="w-8 text-center"></th>
            <th className="w-16 pl-2">ID</th>
            <th className="w-24">Title</th>
            <th className="w-[200px]">Name</th>
            <th className="w-24">Start Date</th>
            <th className="w-24">End Date</th>
            <th className="w-10">Pyr</th>
          </tr>
        </thead>
        <tbody>
          {currentSeason ? (
            <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200 h-12">
              <td className="text-center text-lg">
                <Link href={`/admin/seasons/${currentSeason.id}/settings`} className="text-[#f4a01c] hover:text-[#040f4f]" title="Season settings">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.3l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </Link>
              </td>
              <td className="text-[#f4a01c] text-center font-bold text-lg">
                {isWomenOrGirls ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <circle cx="11" cy="7" r="5" />
                    <path d="M11 12v9" />
                    <path d="M8 18h6" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <circle cx="10" cy="14" r="5" />
                    <path d="M14 10l7-7" />
                    <path d="M16 3h5v5" />
                  </svg>
                )}
              </td>
              <td className="text-blue-600 hover:text-blue-800 underline cursor-pointer pl-2">
                <Link href={`/admin/seasons/${currentSeason.id}`}>{currentSeason.id}</Link>
              </td>
              <td className="font-bold text-[#040f4f]">{currentSeason.name}</td>
              <td>{currentSeason.competitionName || league.competitionName}</td>
              <td className="text-gray-600">{currentSeason.startDate || "-"}</td>
              <td className="text-gray-600">{currentSeason.endDate || "-"}</td>
              <td className="text-gray-600">1</td>
            </tr>
          ) : (
            <tr className="h-16">
              <td colSpan={8} className="text-center text-gray-500 italic">
                No current season found. Click the &apos;+&apos; icon above to add one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center h-[40px] px-4 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setShowHistorical(!showHistorical)}
      >
        <span className="font-bold text-[#040f4f] text-sm uppercase tracking-wider select-none">Historical Seasons ({historicalSeasons.length})</span>
        <span className="ml-auto text-[#040f4f] text-xs opacity-50">
          {showHistorical ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
              <path d="m6 9 6 6 6-6" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
              <path d="m9 6 6 6-6 6" />
            </svg>
          )}
        </span>
      </div>

      {showHistorical && (
        <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-10 text-left border-collapse bg-white">
          <thead className="bg-[#f2f2f2] text-[#040f4f]">
            <tr className="border-b border-[#040f4f] h-10">
              <th className="w-8 text-center"></th>
              <th className="w-8 text-center"></th>
              <th className="w-16 pl-2">ID</th>
              <th className="w-24">Title</th>
              <th className="w-[200px]">Name</th>
              <th className="w-24">Start Date</th>
              <th className="w-24">End Date</th>
              <th className="w-10">Pyr</th>
            </tr>
          </thead>
          <tbody>
            {historicalSeasons.length > 0 ? (
              historicalSeasons.map((season: any) => (
                <tr key={season.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 h-12">
                  <td className="text-center text-lg">
                    <Link href={`/admin/seasons/${season.id}/settings`} className="text-[#f4a01c] hover:text-[#040f4f]" title="Season settings">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.3l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="text-[#f4a01c] text-center font-bold text-lg">
                    {isWomenOrGirls ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                        <circle cx="11" cy="7" r="5" />
                        <path d="M11 12v9" />
                        <path d="M8 18h6" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                        <circle cx="10" cy="14" r="5" />
                        <path d="M14 10l7-7" />
                        <path d="M16 3h5v5" />
                      </svg>
                    )}
                  </td>
                  <td className="text-blue-600 hover:text-blue-800 underline cursor-pointer pl-2">
                    <Link href={`/admin/seasons/${season.id}`}>{season.id}</Link>
                  </td>
                  <td className="font-bold text-[#040f4f]">{season.name}</td>
                  <td className="text-[#040f4f]">{season.competitionName || league.competitionName}</td>
                  <td className="text-gray-600">{season.startDate || "-"}</td>
                  <td className="text-gray-600">{season.endDate || "-"}</td>
                  <td className="text-gray-600">1</td>
                </tr>
              ))
            ) : (
              <tr className="h-16">
                <td colSpan={8} className="text-center text-gray-500 italic">
                  No historical seasons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
