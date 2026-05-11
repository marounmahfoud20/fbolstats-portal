import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// 🚨 Forces Next.js to NEVER cache this page. It will always fetch fresh data.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    notFound();
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        include: {
          person: true
        },
        orderBy: {
          startDate: 'desc'
        }
      }
    }
  });

  if (!team) {
    notFound();
  }

  // 🚨 ADDED: A debug log so we can see exactly what the server finds in your terminal
  console.log(`DEBUG: Found ${team.memberships.length} memberships for Team ID: ${team.id}`);

  // SMART FILTERING
  const activePlayers = team.memberships.filter(m => m.isActive && m.role.toLowerCase() === 'player');
  const historicalPlayers = team.memberships.filter(m => !m.isActive && m.role.toLowerCase() === 'player').slice(0, 25);
  const activeOfficials = team.memberships.filter(m => m.isActive && m.role.toLowerCase() !== 'player');

  return (
    <div className="p-6">

      {/* Header section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4 flex justify-between items-center">
        <h1 className="text-[#040f4f] font-bold text-lg">&nbsp;&nbsp;&nbsp;Team Details</h1>

        <div className="flex items-center gap-4">
          <Link href={`/admin/teams/${params.id}/matches`} title="List Of Matches" className="text-[#040f4f] hover:opacity-70 transition-opacity font-bold text-xs border border-[#040f4f] px-2 py-1 bg-white">
            Matches
          </Link>
          <Link href={`/admin/teams/${params.id}/edit`} title="Edit Information" className="text-[#040f4f] hover:opacity-70 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
        </div>
      </div>

      {/* Team Info Grid */}
      <div className="bg-white border border-[#040f4f] p-4 flex flex-col md:flex-row gap-6 mb-8 text-[#040f4f] text-sm">
        <div className="w-full md:w-3/5 grid grid-cols-2 gap-y-2">
          <div className="font-bold">Team ID:</div><div>{team.id}</div>
          <div className="font-bold">Area:</div><div>{team.area || 'N/A'}</div>
          <div className="font-bold">Country:</div><div>{team.country || 'N/A'}</div>
          <div className="font-bold">Teamname:</div><div>{team.name}</div>
          <div className="font-bold">Shortname:</div><div>{team.shortName || 'N/A'}</div>
          <div className="font-bold">TLA:</div><div>{team.tla || 'N/A'}</div>
          <div className="font-bold">Official Name:</div><div>{team.officialName || 'N/A'}</div>
          <div className="font-bold">Type/Status:</div><div className="capitalize">{team.type || 'club'} - {team.gender || 'both'} - {team.status || 'active'}</div>
          <div className="font-bold">Address:</div><div>{team.address || 'N/A'}</div>
          <div className="font-bold">Coordinates:</div><div>{team.latitude && team.longitude ? `${team.latitude}, ${team.longitude}` : 'N/A'}</div>
          <div className="font-bold">ZIP + City:</div><div>{team.city || 'N/A'}</div>
          <div className="font-bold">URL:</div><div>{team.url || 'N/A'}</div>
          <div className="font-bold">Facebook:</div><div>{team.facebookUrl || 'N/A'}</div>
          <div className="font-bold">Instagram:</div><div>{team.instagramUrl || 'N/A'}</div>
          <div className="font-bold">Twitter:</div><div>{team.twitterUrl || 'N/A'}</div>
          <div className="font-bold">Founded:</div><div>{team.founded || 'N/A'}</div>
          <div className="font-bold">Club Colors:</div><div>{team.clubColors || 'N/A'}</div>
          <div className="font-bold">Nicknames:</div><div>{team.nicknames || 'N/A'}</div>
        </div>
        <div className="w-full md:w-2/5 flex justify-center items-center">
          <div className="w-48 h-48 border border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
            {team.logo ? <img src={team.logo} alt="Team Logo" className="max-w-full max-h-full object-contain" /> : "No Logo Uploaded"}
          </div>
        </div>
      </div>

      {/* Current Squad Section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4 flex justify-between items-center">
        <h2 className="text-[#040f4f] font-bold">&nbsp;&nbsp;&nbsp;Current Squad ({activePlayers.length})</h2>
        <div className="flex items-center gap-3">
          <Link href={`/admin/teams/${params.id}/players/edit-active`} title="Edit Current Players" className="text-[#040f4f] hover:opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </Link>
          <Link href={`/admin/teams/${params.id}/players/add-multiple`} title="Add Multiple Players" className="text-[#040f4f] hover:opacity-70 font-bold border border-[#040f4f] px-1 rounded text-xs bg-white">M</Link>
          <Link href={`/admin/teams/${params.id}/players/exit`} title="Exit Players" className="text-[#040f4f] hover:opacity-70 font-bold border border-[#040f4f] px-1.5 rounded text-xs bg-white">E</Link>
          <Link href={`/admin/teams/${params.id}/players/add-historical`} title="Add Historical Players" className="text-[#040f4f] hover:opacity-70 font-bold border border-[#040f4f] px-1 rounded text-xs bg-white">H</Link>
        </div>
      </div>

      {activePlayers.length === 0 ? (
        <div className="bg-white border border-[#040f4f] p-4 mb-8 text-[#040f4f] text-sm flex justify-center">
          No active players.
        </div>
      ) : (
        <div className="bg-white border border-[#040f4f] p-2 mb-8 text-[#040f4f] text-xs">
          {activePlayers.map(membership => {
            const person = membership.person;
            return (
              <div key={membership.id} className="flex items-center py-1 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div className="w-6 flex justify-center"><div className="w-2 h-2 rounded-full bg-green-500" title="Active"></div></div>
                <div className="w-8 flex justify-center">
                  <Link href={`/admin/people/${person.id}`} title="View">
                    <svg className="w-4 h-4 text-blue-600 hover:text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </Link>
                </div>
                <div className="w-8 flex justify-center">
                  <Link href={`/admin/people/${person.id}/edit`} title="Edit">
                    <svg className="w-4 h-4 text-gray-600 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Link>
                </div>
                <div className="w-20 font-mono text-gray-500">{person.id}</div>
                <div className="flex-1 font-semibold">{person.firstName} {person.lastName}</div>
                <div className="w-24">{person.dob || ''}</div>
                <div className="w-32 flex items-center gap-2">
                  {person.nationality && <span className="text-gray-600">ID: {person.nationality}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Officials Section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4 flex justify-between items-center">
        <h2 className="text-[#040f4f] font-bold">&nbsp;&nbsp;&nbsp;Team Officials ({activeOfficials.length})</h2>
        <Link href={`/admin/teams/${params.id}/officials/past`} title="Past Officials" className="text-[#040f4f] hover:opacity-70">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </div>

      {activeOfficials.length === 0 ? (
        <div className="bg-white border border-[#040f4f] p-4 mb-8 text-[#040f4f] text-sm flex justify-center">
          No team officials.
        </div>
      ) : (
        <div className="bg-white border border-[#040f4f] p-2 mb-8 text-[#040f4f] text-xs">
          {activeOfficials.map(membership => {
            const person = membership.person;
            return (
              <div key={membership.id} className="flex items-center py-1 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div className="w-6 flex justify-center"><div className="w-2 h-2 rounded-full bg-green-500" title="Active"></div></div>
                <div className="w-8 flex justify-center">
                  <Link href={`/admin/people/${person.id}`} title="View">
                    <svg className="w-4 h-4 text-blue-600 hover:text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </Link>
                </div>
                <div className="w-20 font-mono text-gray-500">{person.id}</div>
                <div className="flex-1 font-semibold">{person.firstName} {person.lastName}</div>
                <div className="w-32 capitalize font-bold text-[#f4a01c]">{membership.role.replace('_', ' ')}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historical Players Section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4 flex justify-between items-center">
        <h2 className="text-[#040f4f] font-bold">&nbsp;&nbsp;&nbsp;Last 25 Historical Players</h2>
        <Link href={`/admin/teams/${params.id}/players/past`} title="Past Players" className="text-[#040f4f] hover:opacity-70">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </div>

      {historicalPlayers.length === 0 ? (
        <div className="bg-white border border-[#040f4f] p-4 mb-8 text-[#040f4f] text-sm flex justify-center">
          No historical players found.
        </div>
      ) : (
        <div className="bg-white border border-[#040f4f] p-2 mb-8 text-[#040f4f] text-xs">
          {historicalPlayers.map(membership => {
            const person = membership.person;
            return (
              <div key={membership.id} className="flex items-center py-1 hover:bg-gray-50 border-b border-gray-100 last:border-0 opacity-75">
                <div className="w-6 flex justify-center"><div className="w-2 h-2 rounded-full bg-red-500" title="Inactive"></div></div>
                <div className="w-8 flex justify-center">
                  <Link href={`/admin/people/${person.id}`} title="View">
                    <svg className="w-4 h-4 text-blue-600 hover:text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </Link>
                </div>
                <div className="w-20 font-mono text-gray-500">{person.id}</div>
                <div className="flex-1 font-semibold">{person.firstName} {person.lastName}</div>
                <div className="w-32 text-gray-500 text-right pr-4">
                  {membership.startDate?.substring(0, 4)} - {membership.endDate?.substring(0, 4) || 'Present'}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
