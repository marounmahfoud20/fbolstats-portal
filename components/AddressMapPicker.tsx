"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AddressMapPickerProps = {
  name: string;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  cityFieldName?: string;
  countryFieldName?: string;
  googleApiKey?: string;
  valueMode?: "address" | "city";
};

export default function AddressMapPicker({
  name,
  defaultValue = "",
  className = "",
  placeholder = "Search Address",
  cityFieldName = "city",
  countryFieldName = "country",
  googleApiKey = "",
  valueMode = "address",
}: AddressMapPickerProps) {
  const [search, setSearch] = useState(defaultValue);
  const [mapSearch, setMapSearch] = useState("");
  const [value, setValue] = useState(defaultValue);
  const publicGoogleKey = googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapRef = useRef<HTMLDivElement | null>(null);
  const osmMapRef = useRef<unknown>(null);
  const osmMarkerRef = useRef<unknown>(null);
  const markerRef = useRef<any>(null);
  const mapObjRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [suggestions, setSuggestions] = useState<Array<{
    display: string;
    address: string;
    city: string;
    country: string;
    lat?: string;
    lon?: string;
  }>>([]);
  const [open, setOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    address: string;
    city: string;
    country: string;
    lat?: string;
    lon?: string;
  } | null>(null);
  const [lastClickedPoint, setLastClickedPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [mapSearchStatus, setMapSearchStatus] = useState("");
  const toFieldValue = useCallback(
    (address: string, city: string) => (valueMode === "city" ? (city.trim() || address.trim()) : address.trim()),
    [valueMode]
  );

  const initGoogleMap = useCallback(() => {
    if (!mapRef.current) return;
    const w = window as Window & { google?: any };
    if (!w.google?.maps) return;
    if (mapObjRef.current) return;

    const g = w.google;
    const center = { lat: 33.8547, lng: 35.8623 };
    const map = new g.maps.Map(mapRef.current, {
      center,
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    const marker = new g.maps.Marker({ position: center, map });
    const geocoder = new g.maps.Geocoder();
    mapObjRef.current = map;
    markerRef.current = marker;
    geocoderRef.current = geocoder;

    map.addListener("click", (e: any) => {
      if (!e.latLng || !geocoderRef.current || !markerRef.current) return;
      markerRef.current.setPosition(e.latLng);
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setLastClickedPoint({ lat, lon: lng });
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status !== "OK" || !results || results.length === 0) return;
        const best = results[0];
        const addr = best.formatted_address || "";
        const city =
          best.address_components.find((c: any) => c.types.includes("locality"))?.long_name ||
          best.address_components.find((c: any) => c.types.includes("administrative_area_level_2"))?.long_name ||
          "";
        const country = best.address_components.find((c: any) => c.types.includes("country"))?.long_name || "";
        setSelectedPoint({ address: addr, city, country, lat: String(lat), lon: String(lng) });
        setSearch(toFieldValue(addr, city));
      });
    });
  }, [toFieldValue]);

  useEffect(() => {
    if (!publicGoogleKey) return;
    const w = window as Window & { google?: any };
    if (w.google?.maps) {
      initGoogleMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(publicGoogleKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleMap();
    document.head.appendChild(script);
  }, [publicGoogleKey, initGoogleMap]);

  const applyResolvedPoint = useCallback((lat: number, lon: number, addr: string, city: string, country: string) => {
    const fieldValue = toFieldValue(addr, city);
    setSelectedPoint({ address: addr, city, country, lat: String(lat), lon: String(lon) });
    setSearch(fieldValue);
    setValue(fieldValue);
    if (city) setFieldValue(cityFieldName, city);
    if (country) setFieldValue(countryFieldName, country);
  }, [cityFieldName, countryFieldName, toFieldValue]);

  const reverseFromOsm = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&accept-language=en`,
        { headers: { "Accept-Language": "en" }, cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        display_name?: string;
        address?: {
          village?: string;
          town?: string;
          city?: string;
          municipality?: string;
          county?: string;
          state_district?: string;
          country?: string;
        };
      };
      const city =
        data.address?.village ||
        data.address?.town ||
        data.address?.city ||
        data.address?.municipality ||
        data.address?.county ||
        data.address?.state_district ||
        "";
      const country = data.address?.country || "";
      const addr = data.display_name || "";
      applyResolvedPoint(lat, lon, addr, city, country);
    } catch {
      // no-op
    }
  }, [applyResolvedPoint]);

  useEffect(() => {
    if (publicGoogleKey) return;
    if (!mapRef.current) return;
    if (osmMapRef.current) return;

    let cancelled = false;

    async function initOsmMap() {
      const w = window as Window & { L?: unknown };

      if (!w.L) {
        const cssId = "leaflet-css";
        if (!document.getElementById(cssId)) {
          const link = document.createElement("link");
          link.id = cssId;
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        await new Promise<void>((resolve) => {
          const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
          if (existing) {
            if ((window as Window & { L?: unknown }).L) resolve();
            else existing.addEventListener("load", () => resolve(), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.id = "leaflet-js";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      if (cancelled) return;
      const L = (window as Window & { L?: {
        map: (el: HTMLElement) => { setView: (center: [number, number], zoom: number) => unknown; on: (event: string, cb: (e: { latlng?: { lat?: number; lng?: number } }) => void) => void };
        tileLayer: (url: string, opts: { maxZoom: number; attribution: string }) => { addTo: (map: unknown) => void };
        marker: (center: [number, number]) => { addTo: (map: unknown) => { setLatLng: (point: [number, number]) => void } };
      } }).L;
      if (!L || !mapRef.current) return;

      const center: [number, number] = [33.8547, 35.8623];
      const map = L.map(mapRef.current);
      map.setView(center, 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker(center).addTo(map);
      osmMapRef.current = map;
      osmMarkerRef.current = marker;

      map.on("click", (e: { latlng?: { lat?: number; lng?: number } }) => {
        const lat = e?.latlng?.lat;
        const lon = e?.latlng?.lng;
        if (typeof lat !== "number" || typeof lon !== "number") return;
        setLastClickedPoint({ lat, lon });
        const markerObj = osmMarkerRef.current as { setLatLng?: (point: [number, number]) => void } | null;
        if (markerObj?.setLatLng) markerObj.setLatLng([lat, lon]);
        reverseFromOsm(lat, lon);
      });
    }

    initOsmMap();
    return () => {
      cancelled = true;
    };
  }, [publicGoogleKey, reverseFromOsm]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const country = (
          document.querySelector<HTMLSelectElement>(`select[name="${CSS.escape(countryFieldName)}"]`)?.value || ""
        ).trim();
        const res = await fetch(
          `/api/address-suggestions?q=${encodeURIComponent(q)}${country ? `&country=${encodeURIComponent(country)}` : ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Array<{ display: string; address: string; city: string; country: string; lat?: string; lon?: string }> };
        const next = data.suggestions || [];
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, countryFieldName]);

  function setFieldValue(name: string, nextValue: string) {
    const select = document.querySelector<HTMLSelectElement>(`select[name="${CSS.escape(name)}"]`);
    if (select) {
      const hasOption = Array.from(select.options).some((o) => o.value === nextValue);
      if (hasOption) {
        select.value = nextValue;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    const input = document.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`);
    if (input) {
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function applySuggestion(s: { address: string; city: string; country: string; lat?: string; lon?: string }) {
    const fieldValue = toFieldValue(s.address, s.city);
    setSearch(fieldValue);
    setValue(fieldValue);
    setOpen(false);
    if (s.city) setFieldValue(cityFieldName, s.city);
    if (s.country) setFieldValue(countryFieldName, s.country);
  }

  function applySelectedPoint() {
    if (!selectedPoint) return false;
    const fieldValue = toFieldValue(selectedPoint.address, selectedPoint.city);
    setSearch(fieldValue);
    setValue(fieldValue);
    if (selectedPoint.city) setFieldValue(cityFieldName, selectedPoint.city);
    if (selectedPoint.country) setFieldValue(countryFieldName, selectedPoint.country);
    return true;
  }

  async function searchLeafletLocation() {
    const q = mapSearch.trim();
    if (!q) {
      setMapSearchStatus("Type a place name first.");
      return;
    }
    setMapSearchStatus("Searching...");
    try {
      const country = (
        document.querySelector<HTMLSelectElement>(`select[name="${CSS.escape(countryFieldName)}"]`)?.value || ""
      ).trim();
      const query = country ? `${q}, ${country}` : q;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "en" }, cache: "no-store" }
      );
      if (!res.ok) {
        setMapSearchStatus("Search failed. Try again.");
        return;
      }
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const first = data[0];
      if (!first?.lat || !first?.lon) {
        setMapSearchStatus("No result found.");
        return;
      }
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        setMapSearchStatus("Invalid result from search.");
        return;
      }
      setLastClickedPoint({ lat, lon });
      const mapObj = osmMapRef.current as { setView?: (center: [number, number], zoom?: number) => void } | null;
      if (mapObj?.setView) mapObj.setView([lat, lon], 15);
      const markerObj = osmMarkerRef.current as { setLatLng?: (point: [number, number]) => void } | null;
      if (markerObj?.setLatLng) markerObj.setLatLng([lat, lon]);
      await reverseFromOsm(lat, lon);
      setMapSearchStatus("Point selected from search.");
    } catch {
      setMapSearchStatus("Search failed. Try again.");
    }
  }

  function reverseGeocodeAndApply(lat: number, lon: number) {
    const geocoder = geocoderRef.current;
    if (!geocoder) return false;
    geocoder.geocode({ location: { lat, lng: lon } }, (results: any[], status: string) => {
      if (status !== "OK" || !results || results.length === 0) return;
      const best = results[0];
      const addr = best.formatted_address || "";
      const city =
        best.address_components.find((c: any) => c.types.includes("locality"))?.long_name ||
        best.address_components.find((c: any) => c.types.includes("administrative_area_level_2"))?.long_name ||
        "";
      const country = best.address_components.find((c: any) => c.types.includes("country"))?.long_name || "";
      setSelectedPoint({ address: addr, city, country, lat: String(lat), lon: String(lon) });
      const fieldValue = toFieldValue(addr, city);
      setSearch(fieldValue);
      setValue(fieldValue);
      if (city) setFieldValue(cityFieldName, city);
      if (country) setFieldValue(countryFieldName, country);
    });
    return true;
  }

  return (
    <div className="space-y-2 relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            placeholder={placeholder}
            className={`w-full border border-[#040f4f] p-2 ${className}`}
            autoComplete="off"
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => setOpen(false), 120);
            }}
            onChange={(e) => {
              const next = e.currentTarget.value;
              setSearch(next);
              if (next.trim().length < 2) {
                setSuggestions([]);
                setOpen(false);
              }
            }}
          />
          {open && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-56 overflow-auto rounded border border-gray-300 bg-white shadow">
              {suggestions.map((s) => (
                <button
                  key={`${s.address}-${s.lat || ""}-${s.lon || ""}`}
                  type="button"
                  className="block w-full px-2 py-1 text-left text-xs hover:bg-gray-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(s);
                  }}
                >
                  {s.display}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 overflow-hidden rounded border border-[#040f4f]">
        {publicGoogleKey ? (
          <div ref={mapRef} className="h-72 w-full" />
        ) : (
          <div className="space-y-2 p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchLeafletLocation();
                  }
                }}
                placeholder="Search On Map (e.g. Camille Chamoun Stadium)"
                className="w-full border border-[#040f4f] p-2 text-sm"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void searchLeafletLocation();
                }}
                onClick={() => {
                  void searchLeafletLocation();
                }}
                className="border border-[#040f4f] bg-white px-3 py-2 text-xs font-semibold text-[#040f4f]"
              >
                Find
              </button>
            </div>
            <div className="text-xs text-[#040f4f]/70">{mapSearchStatus}</div>
            <div ref={mapRef} className="h-60 w-full" />
          </div>
        )}
      </div>

      <div className="relative z-50 mt-2 flex justify-end pointer-events-auto">
        <button
          type="button"
          className="cursor-pointer border border-[#040f4f] bg-white px-3 py-2 text-xs font-semibold text-[#040f4f]"
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(false);
            if (applySelectedPoint()) return;
            if (lastClickedPoint && reverseGeocodeAndApply(lastClickedPoint.lat, lastClickedPoint.lon)) return;
            const addr = search.trim();
            setValue(addr);
            const exact = suggestions.find((s) => s.address === addr || s.display === addr);
            if (exact) applySuggestion(exact);
          }}
          onClick={() => {
            if (applySelectedPoint()) return;
            if (lastClickedPoint && reverseGeocodeAndApply(lastClickedPoint.lat, lastClickedPoint.lon)) return;
            const addr = search.trim();
            setValue(addr);
            const exact = suggestions.find((s) => s.address === addr || s.display === addr);
            if (exact) applySuggestion(exact);
          }}
        >
          Use This Address
        </button>
      </div>

      <div className="text-xs">
        {lastClickedPoint ? (
          <span className="font-semibold text-green-700">
            Selected Point Ready ({lastClickedPoint.lat.toFixed(5)}, {lastClickedPoint.lon.toFixed(5)})
          </span>
        ) : (
          <span className="text-[#040f4f]/70">Click On The Map To Select A Point</span>
        )}
      </div>

      <input type="hidden" name={name} value={value} />
      <div className="text-xs text-[#040f4f]/70">Saved Address: {value || "-"}</div>
    </div>
  );
}
