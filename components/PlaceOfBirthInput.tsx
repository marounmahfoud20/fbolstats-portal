"use client";

import { useEffect, useMemo, useState } from "react";

type PlaceOfBirthInputProps = {
  name: string;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  countryFieldName?: string;
};

export default function PlaceOfBirthInput({
  name,
  defaultValue = "",
  className = "",
  placeholder = "Place of Birth",
  countryFieldName,
}: PlaceOfBirthInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const listId = useMemo(() => `pob-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`, [name]);
  const countryFieldKey = countryFieldName ?? "";
  const queryValue = value ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = queryValue.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const country = countryFieldKey
          ? (document.querySelector<HTMLSelectElement>(`select[name="${CSS.escape(countryFieldKey)}"]`)?.value || "").trim()
          : "";
        const res = await fetch(
          `/api/place-suggestions?q=${encodeURIComponent(q)}${country ? `&country=${encodeURIComponent(country)}` : ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Array<{ description?: string }> };
        const next = (data.suggestions || []).map((x) => (x.description || "").trim()).filter(Boolean);
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [queryValue, countryFieldKey]);

  return (
    <div className="relative flex items-center gap-2 w-full">
      <input
        type="text"
        name={name}
        value={value}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          if (!e.currentTarget.value.trim()) {
            setSuggestions([]);
            setOpen(false);
          }
        }}
        onInput={(e) => {
          const next = (e.currentTarget as HTMLInputElement).value;
          if (next.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <div id={listId} className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-300 bg-white shadow">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100"
              onMouseDown={(e) => {
                e.preventDefault();
                setValue(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
