"use client";

import TeamAutocomplete from "@/components/TeamAutocomplete";
import { useState, use, useEffect } from 'react';
import { addMembership } from '@/lib/actions';

export default function AddMembershipPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const [active, setActive] = useState("yes");
  const [teamGender, setTeamGender] = useState("male");
  const [errorMsg, setErrorMsg] = useState("");

  // Track end dates to trigger the smart "Active" auto-toggle
  const [endDay, setEndDay] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  // Rule: If they start typing an end date, auto-switch Active to "No"
  useEffect(() => {
    if (endDay || endMonth || endYear) {
      setActive("no");
    }
  }, [endDay, endMonth, endYear]);

  // Rule: If they force Active to "Yes", wipe out the end date
  const handleActiveToggle = (val: string) => {
    setActive(val);
    if (val === "yes") {
      setEndDay("");
      setEndMonth("");
      setEndYear("");
    }
  };

  // Pre-flight checks before sending to the database
  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(""); // Clear old errors

    const formData = new FormData(e.currentTarget);

    const hasEndDate = endDay && endMonth && endYear;

    // Check Start Date
    const sDay = formData.get("startDay") as string;
    const sMonth = formData.get("startMonth") as string;
    const sYear = formData.get("startYear") as string;
    const hasStartDate = sDay && sMonth && sYear;

    // VALIDATION RULES
    if (active === "no" && !hasEndDate) {
      setErrorMsg("Error: An inactive membership MUST have a complete End Date.");
      return;
    }

    if (hasEndDate && active === "yes") {
      setErrorMsg("Error: A membership with an End Date cannot be active.");
      return;
    }

    if (hasStartDate && hasEndDate) {
      const startDate = new Date(`${sYear}-${sMonth}-${sDay}`);
      const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

      if (endDate <= startDate) {
        setErrorMsg("Error: The End Date must be strictly after the Start Date.");
        return;
      }
    }

    // If all rules pass, execute the backend save
    await addMembership(formData);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Add new Membership (Person ID: {params.id})</h1>
      </div>

      <div className="bg-white border border-[#040f4f] p-4 max-w-3xl">

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-3 mb-4 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleClientSubmit} className="space-y-4 text-sm text-[#040f4f]">
          <input type="hidden" name="personId" value={params.id} />

          {/* Gender Toggle */}
          <div className="flex flex-col border-b border-gray-100 pb-4 mb-4">
            <label className="font-semibold mb-2">Team Gender</label>
            <div className="flex gap-0">
              <label className={`cursor-pointer px-4 py-2 border border-[#040f4f] text-center w-32 transition-colors ${teamGender === 'male' ? 'bg-[#040f4f] text-white' : 'bg-white text-[#040f4f] hover:bg-gray-50'}`}>
                <input type="radio" name="teamGenderToggle" value="male" className="hidden" checked={teamGender === 'male'} onChange={() => setTeamGender('male')} />
                Men's
              </label>
              <label className={`cursor-pointer px-4 py-2 border border-[#040f4f] border-l-0 text-center w-32 transition-colors ${teamGender === 'female' ? 'bg-[#040f4f] text-white' : 'bg-white text-[#040f4f] hover:bg-gray-50'}`}>
                <input type="radio" name="teamGenderToggle" value="female" className="hidden" checked={teamGender === 'female'} onChange={() => setTeamGender('female')} />
                Women's
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Team</label>
              <TeamAutocomplete gender={teamGender} />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Role</label>
              <select name="role" className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
                <option value="Player">Player</option>
                <option value="coach">Coach</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="team_manager">Team Manager</option>
                <option value="sporting_director">Sporting Director</option>
                <option value="physiotherapist">Physiotherapist</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Start Date</label>
              <div className="flex gap-2">
                <input type="text" name="startDay" placeholder="DD" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="startMonth" placeholder="MM" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="startYear" placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-20 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={4} />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">End Date</label>
              <div className="flex gap-2">
                <input type="text" name="endDay" value={endDay} onChange={(e) => setEndDay(e.target.value)} placeholder="DD" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="endMonth" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} placeholder="MM" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="endYear" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-20 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={4} />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Active</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="active" value="yes" checked={active === "yes"} onChange={() => handleActiveToggle("yes")} className="accent-[#040f4f]" /> Yes
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="active" value="no" checked={active === "no"} onChange={() => handleActiveToggle("no")} className="accent-[#040f4f]" /> No
                </label>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-[#040f4f]">
            <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-8 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
              Send Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}