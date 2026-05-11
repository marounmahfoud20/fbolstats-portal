"use client";

import { use } from 'react';
import Link from 'next/link';
import { addMultipleClubPlayers } from '@/lib/actions';
import { COUNTRIES } from '@/lib/countries';
import PlaceOfBirthInput from '@/components/PlaceOfBirthInput';

export default function AddMultiplePlayersPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const teamId = parseInt(params.id);

  const handleSubmit = async (formData: FormData) => {
    await addMultipleClubPlayers(teamId, formData);
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      <form action={handleSubmit} className="max-w-[1200px] mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs">
        <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] p-2 mb-4">
          <span className="text-[#040f4f] font-bold text-sm">
            &nbsp;&nbsp;&nbsp;Add new People
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/admin/teams/${params.id}`} className="ml-4 text-[#040f4f] hover:underline font-bold text-sm">
              Back to Team
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="border border-gray-300 p-2 bg-[#fdfdfd] flex flex-col gap-2">
              {/* Top Row */}
              <div className="flex gap-2 items-center flex-wrap">
                <input type="text" name={`firstname[${i}]`} maxLength={100} className="w-[140px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="First Name" />
                <input type="text" name={`lastname[${i}]`} maxLength={100} className="w-[140px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Last Name" />
                <input type="text" name={`matchname[${i}]`} maxLength={100} className="w-[140px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Match Name" />
                <input type="text" name={`commonname[${i}]`} maxLength={100} className="w-[140px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Common Name" />
                
                <div className="flex items-center gap-1">
                  <input type="text" name={`date_of_birth_day[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none" />
                  <input type="text" name={`date_of_birth_month[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none" />
                  <input type="text" name={`date_of_birth_year[${i}]`} maxLength={4} className="w-[50px] border border-gray-400 p-1 text-center outline-none" />
                </div>
                
                <select name={`gender[${i}]`} className="w-[100px] border border-gray-400 p-1 outline-none bg-white">
                  <option value="male">male</option>
                  <option value="female">female</option>
                </select>
                
                <select name={`status[${i}]`} className="w-[100px] border border-gray-400 p-1 outline-none bg-white">
                  <option value="active">active</option>
                  <option value="retired">retired</option>
                  <option value="dead">dead</option>
                </select>
              </div>

              {/* Bottom Row */}
              <div className="flex gap-2 items-center flex-wrap">
                <PlaceOfBirthInput
                  name={`place_of_birth[${i}]`}
                  countryFieldName={`country_of_birth[${i}]`}
                  className="w-[125px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Place of Birth"
                />
                
                <select name={`country_of_birth[${i}]`} className="w-[150px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
                  <option value="" style={{ color: 'grey' }}>Country of Birth</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select name={`nationality[${i}]`} className="w-[150px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
                  <option value="" style={{ color: 'grey' }}>Nationality</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select name={`position[${i}]`} className="w-[100px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
                  <option value="" style={{ color: 'grey' }}>Position</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Defender">Defender</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Forward">Forward</option>
                </select>

                <select name={`foot[${i}]`} className="w-[100px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
                  <option value="Unknown" style={{ color: 'grey' }}>Foot</option>
                  <option value="right">right</option>
                  <option value="left">left</option>
                  <option value="both">both</option>
                </select>

                <div className="flex items-center">
                  <input type="text" name={`height[${i}]`} maxLength={3} className="w-[45px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Height" />
                </div>
                
                <div className="flex items-center">
                  <input type="text" name={`weight[${i}]`} maxLength={3} className="w-[72px] border border-gray-400 p-1 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Weight" />
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <input type="text" name={`start_date_day[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="DD" title="Start Day" />
                  <input type="text" name={`start_date_month[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="MM" title="Start Month" />
                  <input type="text" name={`start_date_year[${i}]`} maxLength={4} className="w-[50px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="YYYY" title="Start Year" />
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <input type="text" name={`end_date_day[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="DD" title="End Day" />
                  <input type="text" name={`end_date_month[${i}]`} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="MM" title="End Month" />
                  <input type="text" name={`end_date_year[${i}]`} maxLength={4} className="w-[50px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="YYYY" title="End Year" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] px-8 py-2 font-bold hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Send Data
          </button>
        </div>
      </form>
    </div>
  );
}
