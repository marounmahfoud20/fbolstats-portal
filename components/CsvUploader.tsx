"use client";

import React from "react";

export default function CsvUploader() {
  return (
    <div className="flex items-center gap-2">
      <input type="file" accept=".csv" className="text-sm" />
      <button type="button" className="bg-[#040f4f] text-white px-3 py-1 rounded text-sm">
        Upload CSV
      </button>
    </div>
  );
}