import flagCountries from "flag-icons/country.json";
import { resolveCountryName } from "./countries";

const regionNames = new Intl.DisplayNames("en", { type: "region", fallback: "none" });
const flagCodesByName = new Map<string, string>();

for (const { code, name, iso } of flagCountries) {
  flagCodesByName.set(code, code);
  flagCodesByName.set(name.toLowerCase(), code);

  const regionName = iso ? regionNames.of(code.toUpperCase()) : undefined;
  if (regionName) flagCodesByName.set(regionName.toLowerCase(), code);
}

// The portal retains these names in existing records and country selectors.
const countryAliases = new Map([
  ["antigua & deps", "ag"],
  ["bosnia herzegovina", "ba"],
  ["burkina", "bf"],
  ["central african rep", "cf"],
  ["china pr", "cn"],
  ["congo", "cg"],
  ["congo {democratic rep}", "cd"],
  ["dr congo", "cd"],
  ["east timor", "tl"],
  ["ireland {republic}", "ie"],
  ["ivory coast", "ci"],
  ["korea north", "kp"],
  ["korea south", "kr"],
  ["macedonia", "mk"],
  ["myanmar, {burma}", "mm"],
  ["palestine", "ps"],
  ["russian federation", "ru"],
  ["saint vincent & the grenadines", "vc"],
  ["sao tome & principe", "st"],
  ["st kitts & nevis", "kn"],
  ["st lucia", "lc"],
  ["swaziland", "sz"],
  ["turkey", "tr"],
  ["uk", "gb"],
]);

const specialFlagImages = new Map([
  // FIFA's flag for the Chinese Taipei association.
  ["chinese taipei", "/flags/chinese-taipei.png"],
  // The 1927–1948 civil ensign and the 1946–1992 Yugoslav flag.
  ["mandatory palestine", "/flags/mandatory-palestine.svg"],
  ["yugoslavia", "/flags/yugoslavia.svg"],
]);

export function getCountryFlag(value?: string | null) {
  const name = resolveCountryName(value).toLowerCase();
  const src = specialFlagImages.get(name);
  if (src) return { src };

  const code = countryAliases.get(name) ?? flagCodesByName.get(name);
  return code ? { code } : undefined;
}
