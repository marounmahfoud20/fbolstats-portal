"use client";

import { useRef } from "react";
import { useMemo, useState } from "react";

type ExitPlayerRow = {
  membershipId: number;
  personId: number;
  firstName: string | null;
  lastName: string | null;
  matchName: string | null;
  dob: string | null;
  position: string | null;
  startDate: string | null;
};

export default function ExitPlayersForm({
  teamId,
  rows,
  action,
}: {
  teamId: number;
  rows: ExitPlayerRow[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const now = useMemo(() => new Date(), []);
  const [showSecondaryName, setShowSecondaryName] = useState(false);
  const [fillDay, setFillDay] = useState(String(now.getDate()).padStart(2, "0"));
  const [fillMonth, setFillMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [fillYear, setFillYear] = useState(String(now.getFullYear()));

  const applyToAllDateInputs = (day: string, month: string, year: string) => {
    const root = formRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLInputElement>(".eday").forEach((el) => (el.value = day));
    root.querySelectorAll<HTMLInputElement>(".emonth").forEach((el) => (el.value = month));
    root.querySelectorAll<HTMLInputElement>(".eyear").forEach((el) => (el.value = year));
  };

  return (
    <form ref={formRef} action={action} className="max-w-[1200px] mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs">
      <input type="hidden" name="teamId" value={teamId} />

      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#040f4f]">Display Controls</div>
      <div className="flex items-center gap-3 mb-5 border border-gray-300 bg-gray-50 p-2">
        <button type="button" onClick={() => setShowSecondaryName((v) => !v)} className="font-bold underline text-[#040f4f]">
          Toggle Name
        </button>
      </div>

      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#040f4f]">Bulk End Date Controls</div>
      <div className="flex items-center gap-3 mb-5 border border-gray-300 bg-gray-50 p-2">
        <input value={fillDay} onChange={(e) => setFillDay(e.target.value)} className="w-10 border border-gray-400 p-1 text-center" maxLength={2} />
        <input value={fillMonth} onChange={(e) => setFillMonth(e.target.value)} className="w-10 border border-gray-400 p-1 text-center" maxLength={2} />
        <input value={fillYear} onChange={(e) => setFillYear(e.target.value)} className="w-16 border border-gray-400 p-1 text-center" maxLength={4} />
        <button type="button" onClick={() => applyToAllDateInputs(fillDay, fillMonth, fillYear)} className="border px-2 py-1 bg-gray-100">All</button>
        <button
          type="button"
          onClick={() => {
            setFillDay("");
            setFillMonth("");
            setFillYear("");
            applyToAllDateInputs("", "", "");
          }}
          className="border px-2 py-1 bg-gray-100"
        >
          None
        </button>
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            const d = String(t.getDate()).padStart(2, "0");
            const mo = String(t.getMonth() + 1).padStart(2, "0");
            const y = String(t.getFullYear());
            applyToAllDateInputs(d, mo, y);
          }}
          className="border px-2 py-1 bg-gray-100"
        >
          End Day
        </button>
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            const y = t.getFullYear();
            const m = t.getMonth() + 1;
            const last = new Date(y, m, 0).getDate();
            applyToAllDateInputs(String(last).padStart(2, "0"), String(m).padStart(2, "0"), String(y));
          }}
          className="border px-2 py-1 bg-gray-100"
        >
          End Month
        </button>
      </div>

      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#040f4f]">Players Table</div>
      <div className="overflow-x-auto border border-gray-300">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#040f4f] text-white">
              <th colSpan={5} className="border border-gray-300 px-2 py-2 text-left">Player Information</th>
              <th colSpan={3} className="border border-gray-300 px-2 py-2 text-left">Exit Information</th>
            </tr>
            <tr className="bg-gray-100 text-[#040f4f]">
              <th className="border border-gray-300 px-2 py-2 text-left">Select</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Person ID</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Name</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Position</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Start Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left">End Day</th>
              <th className="border border-gray-300 px-2 py-2 text-left">End Month</th>
              <th className="border border-gray-300 px-2 py-2 text-left">End Year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const primary = `${row.firstName || ""} ${row.lastName || ""}`.trim();
              const secondary = row.matchName || primary;

              return (
                <tr key={row.membershipId} className="match-row odd:bg-white even:bg-[#fdfdfd]">
                  <td className="border border-gray-300 px-2 py-2">
                    <input type="checkbox" name="exitMembershipId" value={row.membershipId} />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-mono text-gray-600">{row.personId}</td>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">{showSecondaryName ? secondary : primary}</td>
                  <td className="border border-gray-300 px-2 py-2">{row.position || ""}</td>
                  <td className="border border-gray-300 px-2 py-2">{row.startDate || ""}</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input name={`endDay_${row.membershipId}`} defaultValue={fillDay} maxLength={2} className="eday w-10 border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input name={`endMonth_${row.membershipId}`} defaultValue={fillMonth} maxLength={2} className="emonth w-10 border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input name={`endYear_${row.membershipId}`} defaultValue={fillYear} maxLength={4} className="eyear w-16 border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] px-8 py-2 font-bold hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
          Submit
        </button>
      </div>
    </form>
  );
}
