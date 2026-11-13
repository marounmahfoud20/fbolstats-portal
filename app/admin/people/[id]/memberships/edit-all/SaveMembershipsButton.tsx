"use client";

import { useFormStatus } from "react-dom";

export default function SaveMembershipsButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-8 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors disabled:cursor-wait disabled:opacity-60">
      {pending ? "Saving..." : "Save All Changes"}
    </button>
  );
}
