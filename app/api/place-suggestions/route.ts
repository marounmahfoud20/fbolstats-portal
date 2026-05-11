import { NextRequest, NextResponse } from "next/server";

type Suggestion = { description: string };

function firstNameOnly(value: string) {
  return value.split(",")[0]?.trim() || value.trim();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const country = request.nextUrl.searchParams.get("country")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] as Suggestion[] });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(country ? `${q}, ${country}` : q)}` +
        `&types=geocode&language=en&key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { predictions?: Array<{ description?: string }> };
        const suggestions = (data.predictions || [])
          .map((p) => firstNameOnly((p.description || "").trim()))
          .filter(Boolean)
          .slice(0, 8)
          .map((description) => ({ description }));
        return NextResponse.json({ suggestions });
      }
    } catch {
      // Fallback below
    }
  }

  try {
    const osmUrl =
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8` +
      `&accept-language=en&q=${encodeURIComponent(country ? `${q}, ${country}` : q)}`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "fbolstats-portal/1.0", "Accept-Language": "en" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] as Suggestion[] });
    const data = (await res.json()) as Array<{
      display_name?: string;
      address?: {
        village?: string;
        town?: string;
        city?: string;
        municipality?: string;
        county?: string;
        state_district?: string;
      };
    }>;
    const suggestions = data
      .map((x) => {
        const a = x.address;
        const primary =
          a?.village ||
          a?.town ||
          a?.city ||
          a?.municipality ||
          a?.county ||
          a?.state_district ||
          x.display_name ||
          "";
        return firstNameOnly(primary.trim());
      })
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 8)
      .map((description) => ({ description }));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] as Suggestion[] });
  }
}
