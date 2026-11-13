import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Add Membership", "person");

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
