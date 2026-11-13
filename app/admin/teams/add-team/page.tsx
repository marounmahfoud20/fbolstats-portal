export const metadata = { title: "Add Team" };

import { redirect } from 'next/navigation';

export default function LegacyAddTeamRedirect() {
  redirect('/admin/clubentity/add-team');
}
