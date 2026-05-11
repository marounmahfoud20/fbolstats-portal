import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import UploadPictureButton from './UploadPictureButton';
import AddPersonPage from '../add-person/page';
import { resolveCountryName } from '@/lib/countries';
import { resolvePositionName } from '@/lib/people-format';

export default async function PlayerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  if (params.id === 'add-person') {
    return <AddPersonPage />;
  }

  const personId = parseInt(params.id);

  if (isNaN(personId)) {
    notFound();
  }

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      team: true,
      memberships: {
        include: {
          team: true
        },
        orderBy: {
          startDate: 'desc'
        }
      }
    }
  });

  if (!person) {
    notFound();
  }

  // Filter the new memberships array into Domestic and International
  const domesticMemberships = person.memberships?.filter(m => m.team?.type !== 'national') || [];
  const internationalMemberships = person.memberships?.filter(m => m.team?.type === 'national') || [];

  return (
    <div className="p-6">

      {/* Header section with icons */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4 flex justify-between items-center">
        <h1 className="text-[#040f4f] font-bold text-lg">Player Details</h1>

        <div className="flex items-center gap-4">
          {/* Picture Upload Icon */}
          <UploadPictureButton personId={person.id} />

          {/* Gear Icon (Edit Information) */}
          <Link href={`/admin/people/${params.id}/edit`} title="Edit Information" className="text-[#040f4f] hover:opacity-70 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="h-6 object-contain" />
        </div>
      </div>

      <div className="bg-white border border-[#040f4f] p-4 flex flex-col md:flex-row gap-6 mb-8 text-[#040f4f] text-sm">
        <div className="w-full md:w-3/5 grid grid-cols-2 gap-y-2">
          <div className="font-bold">People ID:</div>
          <div>{person.id}</div>

          <div className="font-bold">Firstname:</div>
          <div>{person.firstName || 'N/A'}</div>

          <div className="font-bold">Lastname:</div>
          <div>{person.lastName || 'N/A'}</div>

          <div className="font-bold">Common Name:</div>
          <div>{person.commonName || 'N/A'}</div>

          <div className="font-bold">Date of Birth:</div>
          <div>{person.dob || 'N/A'}</div>

          <div className="font-bold">Place of Birth:</div>
          <div>{person.placeOfBirth || 'N/A'}</div>

          <div className="font-bold">Country of Birth:</div>
          <div>{resolveCountryName(person.countryOfBirth) || 'N/A'}</div>

          <div className="font-bold">Nationality:</div>
          <div>{resolveCountryName(person.nationality) || 'N/A'}</div>

          <div className="font-bold">Position:</div>
          <div>{resolvePositionName(person.position) || 'N/A'}</div>

          <div className="font-bold">Referee:</div>
          <div>{person.isReferee || 'N/A'}</div>

          <div className="font-bold">Gender:</div>
          <div>{person.gender || 'N/A'}</div>
        </div>

        <div className="w-full md:w-2/5 flex justify-center items-center">
          <div className="w-[150px] h-[150px] border border-[#040f4f] flex items-center justify-center bg-gray-50 text-gray-400 overflow-hidden">
            {person.image ? (
              <img src={person.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>No Image</span>
            )}
          </div>
        </div>
      </div>

      {/* Domestic Memberships */}
      <div className="mb-8">
        <div className="bg-[#f4a01c] border border-[#040f4f] p-2 flex justify-between items-center mb-2">
          <h2 className="text-[#040f4f] font-bold">Domestic Memberships</h2>
          <div className="flex items-center gap-3">
            <Link href={`/admin/people/${params.id}/memberships/add`} className="text-[#040f4f] hover:opacity-70 font-bold" title="Add Membership">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Link>
            <Link href={`/admin/people/${params.id}/memberships/edit-all`} className="text-[#040f4f] hover:opacity-70 font-bold text-lg leading-none" title="Edit Multiple">
              M
            </Link>
          </div>
        </div>
        <div className="border border-[#040f4f] overflow-x-auto">
          <table className="w-full text-sm text-left text-[#040f4f]">
            <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Team</th>
                <th className="p-2">Role</th>
                <th className="p-2">Active</th>
                <th className="p-2">Start Date</th>
                <th className="p-2">End Date</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {domesticMemberships.length > 0 ? (
                domesticMemberships.map((m) => (
                  <tr key={m.id} className="border-b border-[#040f4f] hover:bg-gray-50">
                    <td className="p-2 font-mono">
                      <Link href={`/admin/people/${person.id}/membership/${m.id}`} className="hover:underline">
                        {m.id}
                      </Link>
                    </td>
                    <td className="p-2">
                      <Link href={`/admin/teams/${m.teamId}`} className="hover:underline">{m.team?.name || 'Unknown'}</Link>
                    </td>
                    <td className="p-2 capitalize">{m.role.replace('_', ' ')}</td>
                    <td className="p-2">{m.isActive ? 'yes' : 'no'}</td>
                    <td className="p-2">{m.startDate || 'N/A'}</td>
                    <td className="p-2">{m.endDate || 'N/A'}</td>
                    <td className="p-2 text-right">
                      <Link href={`/admin/people/${person.id}/memberships/edit-all`} className="inline-block" title="Edit Stint">
                        <svg className="w-4 h-4 text-gray-600 hover:text-[#f4a01c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No domestic memberships.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* International Memberships */}
      <div>
        <div className="bg-[#f4a01c] border border-[#040f4f] p-2 flex justify-between items-center mb-2">
          <h2 className="text-[#040f4f] font-bold">International Memberships</h2>
          <div className="flex items-center gap-3">
            <Link href={`/admin/people/${params.id}/memberships/add`} className="text-[#040f4f] hover:opacity-70 font-bold" title="Add Membership">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Link>
            <Link href={`/admin/people/${params.id}/memberships/edit-all`} className="text-[#040f4f] hover:opacity-70 font-bold text-lg leading-none" title="Edit Multiple">
              M
            </Link>
          </div>
        </div>
        <div className="border border-[#040f4f] overflow-x-auto">
          <table className="w-full text-sm text-left text-[#040f4f]">
            <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Team</th>
                <th className="p-2">Role</th>
                <th className="p-2">Active</th>
                <th className="p-2">Start Date</th>
                <th className="p-2">End Date</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {internationalMemberships.length > 0 ? (
                internationalMemberships.map((m) => (
                  <tr key={m.id} className="border-b border-[#040f4f] hover:bg-gray-50">
                    <td className="p-2 font-mono">
                      <Link href={`/admin/people/${person.id}/membership/${m.id}`} className="hover:underline">
                        {m.id}
                      </Link>
                    </td>
                    <td className="p-2">
                      <Link href={`/admin/teams/${m.teamId}`} className="hover:underline">{m.team?.name || 'Unknown'}</Link>
                    </td>
                    <td className="p-2 capitalize">{m.role.replace('_', ' ')}</td>
                    <td className="p-2">{m.isActive ? 'yes' : 'no'}</td>
                    <td className="p-2">{m.startDate || 'N/A'}</td>
                    <td className="p-2">{m.endDate || 'N/A'}</td>
                    <td className="p-2 text-right">
                      <Link href={`/admin/people/${person.id}/memberships/edit-all`} className="inline-block" title="Edit Stint">
                        <svg className="w-4 h-4 text-gray-600 hover:text-[#f4a01c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No international memberships.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
