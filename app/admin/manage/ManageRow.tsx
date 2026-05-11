"use client";

import { useState } from "react";
import { updateLeague, deleteLeague } from "@/lib/actions";

type ManageLeague = {
  id: number;
  competitionName: string;
  type: string;
  footballType: "club" | "national";
};

export default function ManageRow({ league }: { league: ManageLeague }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form action={async (formData) => {
        await updateLeague(formData);
        setIsEditing(false);
      }} className="mb-2 grid grid-cols-1 items-center gap-2 border border-[#040f4f] bg-white p-3 md:grid-cols-[1fr_220px_280px_auto_auto]">
        <input type="hidden" name="id" value={league.id} />
        
        <input 
          name="competitionName" 
          defaultValue={league.competitionName} 
          className="border border-[#040f4f] p-2 text-sm text-[#040f4f] outline-none focus:ring-1 focus:ring-[#040f4f]" 
          required 
        />
        <input 
          name="type" 
          defaultValue={league.type} 
          list="manage-categories" 
          className="border border-[#040f4f] p-2 text-sm text-[#040f4f] outline-none focus:ring-1 focus:ring-[#040f4f]" 
          required 
        />
        <div className="flex gap-4 rounded border border-[#040f4f]/25 bg-[#f8fafc] px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#040f4f]">
            <input type="radio" name="footballType" value="club" defaultChecked={league.footballType !== "national"} className="accent-[#040f4f]" />
            Club Football
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#040f4f]">
            <input type="radio" name="footballType" value="national" defaultChecked={league.footballType === "national"} className="accent-[#040f4f]" />
            National Team Football
          </label>
        </div>
        
        <button type="submit" className="border border-[#0a7a36] bg-[#16a34a] px-4 py-2 text-xs font-bold text-white hover:bg-[#15803d] transition-colors">Save</button>
        <button type="button" onClick={() => setIsEditing(false)} className="border border-[#040f4f] bg-white px-4 py-2 text-xs font-bold text-[#040f4f] hover:bg-gray-100 transition-colors">Cancel</button>
      </form>
    );
  }

  return (
    <div className="mb-2 flex items-center justify-between border border-[#040f4f]/30 bg-white p-3 hover:border-[#040f4f] transition-colors">
      <div className="min-w-0">
        <span className="mr-3 text-sm font-bold text-[#040f4f]">{league.competitionName}</span>
        <span className="inline-block border border-[#040f4f]/20 bg-[#f2f2f2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#040f4f]">
          {league.type}
        </span>
        <span className="ml-2 inline-block border border-[#040f4f]/20 bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#040f4f]">
          {league.footballType === "national" ? "National Team" : "Club"}
        </span>
      </div>
      <div className="flex gap-3 items-center">
        <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#0f3d8a] hover:underline">
          Edit
        </button>
        <form action={deleteLeague}>
          <input type="hidden" name="id" value={league.id} />
          <button 
            type="submit" 
            className="text-xs font-bold text-[#dc2626] hover:underline" 
            onClick={(e) => { if(!confirm("WARNING: This will delete the competition. Are you sure?")) e.preventDefault(); }}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
