"use client";

import { useState } from "react";
import Link from "next/link";

type League = {
  id: number;
  competitionName: string;
  type: string | null;
  footballType?: string | null;
};

type LeagueCategory = {
  name: string;
  footballType: string;
};

export default function Sidebar({ leagues, leagueCategories }: { leagues: League[]; leagueCategories: LeagueCategory[] }) {
  const [openMenu, setOpenMenu] = useState<null | "club" | "national">(null);

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[84px] flex-col justify-between border-r border-slate-200 bg-white/90 py-4 shadow-[0_8px_30px_rgb(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col items-center gap-1">
          <Link
            href="/admin/tasks"
            className="mb-2 flex w-full items-center justify-center border-b border-slate-200 px-2 py-5"
            title="Tasks"
          >
            <img src="/logo-minimal.png" alt="FbolStats" className="w-16 object-contain" />
          </Link>

          <button
            onClick={() => setOpenMenu((v) => (v === "club" ? null : "club"))}
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 ${openMenu === "club" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100"}`}
            title="Club Competitions"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </button>

          <Link href="/admin/people" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100" title="People">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </Link>
          <Link href="/admin/clubentity" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100" title="Club Entities">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </Link>
          <Link href="/admin/teams" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100" title="Teams Search">
            <img
              src="/football-club-icon-style-free-vector.png"
              alt="Teams Search"
              className="h-7 w-7 object-contain"
            />
          </Link>
          <Link href="/admin/venues" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100" title="Venues">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 21V10l5-3 5 3v11" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setOpenMenu((v) => (v === "national" ? null : "national"))}
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 ${openMenu === "national" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100"}`}
            title="National Team Competitions"
          >
            <img
              src="/Lebanese Football Association.png"
              alt="Lebanese Football Association"
              className="h-7 w-7 object-contain"
              style={{ filter: "grayscale(1) sepia(1) hue-rotate(165deg) saturate(6) brightness(0.45) contrast(1.2)" }}
            />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 pb-2">
          <Link href="/admin/administrator" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100" title="Administrator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
          <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-300" title="Log out (coming soon)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
        </div>
      </aside>

      {openMenu ? (
        <div className="fixed left-[84px] top-0 z-40 h-screen w-[320px] border-r border-slate-200 bg-white/95 shadow-[0_8px_30px_rgb(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="font-semibold text-slate-800">{openMenu === "club" ? "Club Competitions" : "National Team Competitions"}</div>
            <Link href="/admin/manage" onClick={() => setOpenMenu(null)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
              Manage
            </Link>
          </div>

          <div className="h-[calc(100%-64px)] overflow-y-auto px-3 py-3">
            {(() => {
              const filteredLeagues = leagues.filter((l) =>
                openMenu === "national"
                  ? (l.footballType || "club").toLowerCase().includes("national")
                  : !(l.footballType || "club").toLowerCase().includes("national")
              );
              const categoryOrder = ["Men", "Women", "Youth Boys", "Youth Girls"];
              const filteredSavedCategories = leagueCategories
                .filter((c) =>
                  openMenu === "national"
                    ? (c.footballType || "club").toLowerCase().includes("national")
                    : !(c.footballType || "club").toLowerCase().includes("national")
                )
                .map((c) => c.name);

              const sortedCategories = Array.from(new Set([
                ...filteredLeagues.map((l) => l.type || "Other"),
                ...filteredSavedCategories,
              ])).sort((a, b) => {
                const ai = categoryOrder.indexOf(a);
                const bi = categoryOrder.indexOf(b);
                const aRank = ai === -1 ? 999 : ai;
                const bRank = bi === -1 ? 999 : bi;
                if (aRank !== bRank) return aRank - bRank;
                return a.localeCompare(b);
              });

              if (sortedCategories.length === 0) {
                return <div className="rounded border border-slate-200 bg-white p-3 text-xs text-slate-500">No categories found in this section yet.</div>;
              }

              return sortedCategories.map((category) => (
                <details key={category} className="mb-2 rounded-lg border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-700">{category}</summary>
                  <div className="space-y-1 pb-2">
                    {filteredLeagues
                      .filter((l) => (l.type || "Other") === category)
                      .sort((a, b) => a.competitionName.localeCompare(b.competitionName))
                      .map((l) => (
                        <Link
                          key={l.id}
                          href={`/admin/leagues/${l.id}`}
                          onClick={() => setOpenMenu(null)}
                          className="mx-2 block rounded-md px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {l.competitionName}
                        </Link>
                      ))}
                    {filteredLeagues.filter((l) => (l.type || "Other") === category).length === 0 ? (
                      <div className="mx-2 rounded-md px-3 py-2 text-[11px] text-slate-400">No competitions yet</div>
                    ) : null}
                  </div>
                </details>
              ));
            })()}
          </div>
        </div>
      ) : null}
    </>
  );
}
