import Image from "next/image";
import "flag-icons/css/flag-icons.min.css";
import { getCountryFlag } from "@/lib/country-flags";
import { resolveCountryName } from "@/lib/countries";

export default function NationalityLabel({ nationality }: { nationality?: string | null }) {
  const name = resolveCountryName(nationality);
  if (!name) return "-";

  const flag = getCountryFlag(name);

  return (
    <span className="inline-flex items-center gap-1">
      {flag?.src && (
        <Image src={flag.src} alt="" width={16} height={12} unoptimized className="h-3 w-4 shrink-0 object-contain" />
      )}
      {flag?.code && <span aria-hidden="true" className={`fi fi-${flag.code} shrink-0`} />}
      {name}
    </span>
  );
}
