"use client";

import { useState } from "react";
import { updateLeague } from "@/lib/actions";

export default function LeagueRow({ league }: { league: any }) {
  const [isEditing, setIsEditing] = useState(false);

  // If "Edit" is clicked, show the input form
  if (isEditing) {
    return (
      <form action={async (formData) => {
        await updateLeague(formData);
        setIsEditing(false); // Close edit mode when done
      }} className="bg-white border p-3 rounded shadow-sm text-black flex gap-2 w-full items-center">
        
        <input type="hidden" name="id" value={league.id} />
        
        <input 
          name="competitionName" 
          defaultValue={league.competitionName} 
          className="border border-gray-300 p-1 rounded flex-1" 
          required 
        />
        
        <input 
          name="type" 
          defaultValue={league.type} 
          list="league-types" 
          className="border border-gray-300 p-1 rounded w-48" 
          required 
        />
        
        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Save</button>
        <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">Cancel</button>
      </form>
    );
  }

  // Normal view
  return (
    <li className="bg-white border p-3 rounded shadow-sm text-black flex justify-between items-center w-full">
      <div>
        <span className="font-bold mr-3">{league.competitionName}</span>
        <span className="text-gray-600 text-sm bg-gray-200 px-2 py-1 rounded mr-4">{league.type}</span>
      </div>
      
      {/* New Link and Edit Button */}
      <div className="flex gap-4 items-center">
        <a href={`/admin/leagues/${league.id}`} className="text-green-600 hover:underline text-sm font-bold bg-green-50 px-2 py-1 rounded">
          Manage Seasons →
        </a>
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline text-sm font-semibold">
          Edit
        </button>
      </div>
    </li>
  );
}