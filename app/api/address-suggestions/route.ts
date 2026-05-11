import { NextRequest, NextResponse } from "next/server";

type AddressSuggestion = {
  display: string;
  address: string;
  city: string;
  country: string;
  lat?: string;
  lon?: string;
};

function pickCity(address?: Record<string, string>): string {
  if (!address) return "";
  return (
    address.village ||
    address.town ||
    address.city ||
    address.municipality ||
    address.county ||
    address.state_district ||
    ""
  );
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const country = request.nextUrl.searchParams.get("country")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] as AddressSuggestion[] });

  try {
    const osmUrl =
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8` +
      `&accept-language=en&q=${encodeURIComponent(country ? `${q}, ${country}` : q)}`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "fbolstats-portal/1.0", "Accept-Language": "en" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] as AddressSuggestion[] });

    const data = (await res.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      address?: Record<string, string>;
    }>;

    const suggestions = data.map((x) => {
      const city = pickCity(x.address);
      const countryName = (x.address?.country || "").trim();
      return {
        display: x.display_name || "",
        address: x.display_name || "",
        city,
        country: countryName,
        lat: x.lat,
        lon: x.lon,
      };
    }).filter((x) => x.address.trim().length > 0);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] as AddressSuggestion[] });
  }
}
