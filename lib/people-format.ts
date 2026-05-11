import { resolveCountryName } from "@/lib/countries";

const POSITION_MAP: Record<string, string> = {
  "7": "Forward",
  "35": "Defender",
  "76": "Goalkeeper",
  "104": "Midfielder",
  attacker: "Forward",
  forward: "Forward",
  defender: "Defender",
  midfielder: "Midfielder",
  goalkeeper: "Goalkeeper",
};

const COUNTRY_TO_CODE: Record<string, string> = {
  lebanon: "LB",
  france: "FR",
  spain: "ES",
  italy: "IT",
  germany: "DE",
  england: "GB",
  "united kingdom": "GB",
  "united states": "US",
  brazil: "BR",
  argentina: "AR",
};

function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

export function resolvePositionName(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const normalized = POSITION_MAP[trimmed.toLowerCase()] || POSITION_MAP[trimmed];
  return normalized || trimmed;
}

export function genderIcon(gender?: string | null): string {
  const g = (gender || "").trim().toLowerCase();
  if (g === "male") return "♂";
  if (g === "female") return "♀";
  return "-";
}

export function nationalityFlag(nationality?: string | null): string {
  const display = resolveCountryName(nationality);
  if (!display) return "";
  const key = display.toLowerCase();
  const code = COUNTRY_TO_CODE[key] || (display.length === 2 ? display.toUpperCase() : "");
  return codeToFlag(code);
}
