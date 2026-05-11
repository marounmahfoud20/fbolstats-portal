import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';

export default async function GroupHubPage(props: { params: Promise<{ id: string; seasonId: string; groupId: string }> }) {
  const params = await props.params;

  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Round Hub</h1>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1 border border-[#040f4f] px-2 py-1 rounded text-xs bg-white text-[#040f4f]">
          <span className="font-bold">Matches</span>
          <Link href={`/admin/leagues/${params.id}/${params.seasonId}/${params.groupId}/matches`}>
            <RefreshCw size={12} className="cursor-pointer" />
          </Link>
          <Link href={`/admin/leagues/${params.id}/${params.seasonId}/${params.groupId}/add-match`}>
            <Plus size={12} className="cursor-pointer" />
          </Link>
          <Link href={`/admin/leagues/${params.id}/${params.seasonId}/${params.groupId}/bulk-matches`}>
            <span className="cursor-pointer font-bold px-1">M</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 border border-[#040f4f] px-2 py-1 rounded text-xs bg-white text-[#040f4f]">
          <span className="font-bold">Round Teams</span>
          <Link href={`/admin/leagues/${params.id}/${params.seasonId}/${params.groupId}/round-teams`}>
            <Plus size={12} className="cursor-pointer" />
          </Link>
        </div>
      </div>
    </div>
  );
}
