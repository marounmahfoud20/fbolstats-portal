import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countries";

const COUNTRY_ALIASES: Record<string, string> = {
  "united states of america": "United States",
  "usa": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "russia": "Russian Federation",
  "south korea": "Korea South",
  "republic of korea": "Korea South",
  "north korea": "Korea North",
  "democratic people's republic of korea": "Korea North",
  "cote d'ivoire": "Ivory Coast",
  "cote d’ivoire": "Ivory Coast",
  "czechia": "Czech Republic",
  "eswatini": "Swaziland",
  "vatican": "Vatican City",
  "moldova, republic of": "Moldova",
  "bolivia (plurinational state of)": "Bolivia",
  "venezuela (bolivarian republic of)": "Venezuela",
  "iran (islamic republic of)": "Iran",
  "syria arab republic": "Syria",
  "tanzania, united republic of": "Tanzania",
  "lao people's democratic republic": "Laos",
  "myanmar": "Myanmar, {Burma}",
  "timor-leste": "East Timor",
  "cape verde": "Cape Verde",
  "congo-brazzaville": "Congo",
  "congo-kinshasa": "Congo {Democratic Rep}",
  "democratic republic of the congo": "Congo {Democratic Rep}",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchCountry(raw: string | null): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (COUNTRY_ALIASES[n]) return COUNTRY_ALIASES[n];

  const exact = COUNTRIES.find((c) => normalize(c) === n);
  if (exact) return exact;

  const partial = COUNTRIES.find((c) => n.includes(normalize(c)));
  if (partial) return partial;

  return null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ country: null });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "fbolstats-portal/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) return NextResponse.json({ country: null });
    const data = (await response.json()) as Array<{ address?: { country?: string } }>;
    const rawCountry = data?.[0]?.address?.country || null;
    const country = matchCountry(rawCountry);
    return NextResponse.json({ country });
  } catch {
    return NextResponse.json({ country: null });
  }
}

