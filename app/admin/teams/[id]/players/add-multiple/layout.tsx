import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Add Multiple Players", "team");

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
