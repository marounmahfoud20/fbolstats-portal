"use client";

import { useState } from "react";
import { deleteCompetitionCategory, updateCategory } from "@/lib/actions";

export default function CategoryRow({ category, footballType }: { category: string; footballType: "club" | "national" }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form action={async (formData) => {
        await updateCategory(formData);
        setIsEditing(false);
      }} className="flex items-center gap-2 border border-[#040f4f] bg-white p-3">
        <input type="hidden" name="oldType" value={category} />
        <input type="hidden" name="footballType" value={footballType} />
        
        <input 
          name="newType" 
          defaultValue={category} 
          className="flex-1 border border-[#040f4f] p-2 text-sm text-[#040f4f] outline-none focus:ring-1 focus:ring-[#040f4f]" 
          required 
        />
        
        <button type="submit" className="border border-[#0a7a36] bg-[#16a34a] px-3 py-2 text-xs font-bold text-white hover:bg-[#15803d] transition-colors">Save</button>
        <button type="button" onClick={() => setIsEditing(false)} className="border border-[#040f4f] bg-white px-3 py-2 text-xs font-bold text-[#040f4f] hover:bg-gray-100 transition-colors">Cancel</button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border border-[#040f4f]/30 bg-white p-3 hover:border-[#040f4f] transition-colors">
      <span className="text-sm font-bold text-[#040f4f]">{category}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#0f3d8a] hover:underline">
          Edit
        </button>
        <form action={deleteCompetitionCategory}>
          <input type="hidden" name="name" value={category} />
          <input type="hidden" name="footballType" value={footballType} />
          <button
            type="submit"
            className="text-xs font-bold text-[#dc2626] hover:underline"
            onClick={(e) => {
              if (!confirm(`Delete "${category}" category?`)) e.preventDefault();
            }}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
