"use client";

import { useFormStatus } from "react-dom";

export default function CompetitionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="border border-[#040f4f] bg-[#f4a01c] px-4 py-2 text-xs font-bold text-[#040f4f] hover:bg-white disabled:cursor-wait disabled:opacity-60">
      {pending ? "Creating..." : "Create competition"}
    </button>
  );
}
