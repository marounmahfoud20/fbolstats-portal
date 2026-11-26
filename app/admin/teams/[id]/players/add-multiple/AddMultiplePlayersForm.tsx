"use client";

import { useState } from 'react';
import Link from 'next/link';
import { addMultipleClubPlayers } from '@/lib/actions';
import { COUNTRIES } from '@/lib/countries';
import PlaceOfBirthInput from '@/components/PlaceOfBirthInput';
import MembershipSaveForm from '@/components/MembershipSaveForm';
import { parseDayFirstDate } from '@/lib/date-input';

type SharedPlayerValues = { nationality: string; country_of_birth: string; start_date_day: string; start_date_month: string; start_date_year: string; end_date_day: string; end_date_month: string; end_date_year: string };

export default function AddMultiplePlayersForm({ teamId, teamName, teamCountry }: { teamId: number; teamName: string; teamCountry: string }) {
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkNationality, setBulkNationality] = useState(teamCountry);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [rowValues, setRowValues] = useState<Partial<SharedPlayerValues>[]>(() => Array.from({ length: 50 }, () => ({})));

  const updateRow = (index: number, field: keyof SharedPlayerValues, value: string) => {
    setRowValues((previous) => previous.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const applyBulkValues = () => {
    setBulkError('');
    setBulkMessage('');
    const start = parseDayFirstDate(bulkStart);
    const end = parseDayFirstDate(bulkEnd);
    if ((bulkStart && !start) || (bulkEnd && !end)) {
      setBulkError('Enter valid membership dates in DD/MM/YYYY format.');
      return;
    }
    if (start && end && end.iso < start.iso) {
      setBulkError('The membership end date must be on or after the start date.');
      return;
    }
    if (!bulkStart && !bulkEnd && !bulkNationality) {
      setBulkError('Choose at least one bulk value to apply.');
      return;
    }
    const values: Partial<SharedPlayerValues> = {};
    if (bulkNationality) {
      values.nationality = bulkNationality;
      values.country_of_birth = bulkNationality;
    }
    if (start) {
      const { year, month, day } = start;
      Object.assign(values, { start_date_day: day, start_date_month: month, start_date_year: year });
    }
    if (end) {
      const { year, month, day } = end;
      Object.assign(values, { end_date_day: day, end_date_month: month, end_date_year: year });
    }
    setRowValues((previous) => previous.map((row) => ({ ...row, ...values })));
    setBulkMessage('Bulk values applied to all player rows. You can still edit individual players below.');
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      <MembershipSaveForm action={addMultipleClubPlayers.bind(null, teamId)} className="max-w-[1200px] mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs">
        <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] p-2 mb-4">
          <span className="text-[#040f4f] font-bold text-sm">
            &nbsp;&nbsp;&nbsp;Add new People
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/admin/teams/${teamId}`} className="ml-4 text-[#040f4f] hover:underline font-bold text-sm">
              Back to Team
            </Link>
          </div>
        </div>

        <section className="mb-5 border border-[#040f4f] bg-[#f0f3ff] p-3 text-[#040f4f]" aria-labelledby="bulk-values-title">
          <h2 id="bulk-values-title" className="mb-1 font-bold text-sm">Bulk values - {teamName}</h2>
          <p className="mb-3">Apply the filled values to every player row before sending. Blank bulk fields leave existing row values unchanged.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <label className="flex flex-col gap-1 font-semibold">
              Membership start date
              <input type="text" placeholder="DD/MM/YYYY" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" title="DD/MM/YYYY, for example 31/12/2026" value={bulkStart} onChange={(event) => setBulkStart(event.target.value)} className="min-w-0 border border-gray-400 bg-white p-2 font-normal" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">
              Membership end date
              <input type="text" placeholder="DD/MM/YYYY" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" title="DD/MM/YYYY, for example 31/12/2026" value={bulkEnd} onChange={(event) => setBulkEnd(event.target.value)} className="min-w-0 border border-gray-400 bg-white p-2 font-normal" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">
              Nationality and country of birth
              <select value={bulkNationality} onChange={(event) => setBulkNationality(event.target.value)} className="min-w-0 border border-gray-400 bg-white p-2 font-normal">
                <option value="">Choose nationality</option>
                {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </label>
            <button type="button" onClick={applyBulkValues} className="border border-[#040f4f] bg-[#f4a01c] p-2 font-bold hover:bg-[#040f4f] hover:text-white">Apply to all players</button>
          </div>
          {bulkError && <p role="alert" className="mt-2 text-red-700">{bulkError}</p>}
          {bulkMessage && <p role="status" className="mt-2 text-green-800">{bulkMessage}</p>}
        </section>

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

                <select name={`country_of_birth[${i}]`} value={rowValues[i].country_of_birth || ""} onChange={(event) => updateRow(i, "country_of_birth", event.target.value)} className="w-[150px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
                  <option value="" style={{ color: 'grey' }}>Country of Birth</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select name={`nationality[${i}]`} value={rowValues[i].nationality || ""} onChange={(event) => updateRow(i, "nationality", event.target.value)} className="w-[150px] border border-gray-400 p-1 outline-none bg-white text-gray-700">
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
                  <input type="text" name={`start_date_day[${i}]`} value={rowValues[i].start_date_day || ""} onChange={(event) => updateRow(i, "start_date_day", event.target.value)} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="DD" title="Start Day" />
                  <input type="text" name={`start_date_month[${i}]`} value={rowValues[i].start_date_month || ""} onChange={(event) => updateRow(i, "start_date_month", event.target.value)} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="MM" title="Start Month" />
                  <input type="text" name={`start_date_year[${i}]`} value={rowValues[i].start_date_year || ""} onChange={(event) => updateRow(i, "start_date_year", event.target.value)} maxLength={4} className="w-[50px] border border-gray-400 p-1 text-center outline-none bg-[#F0F0FF]" placeholder="YYYY" title="Start Year" />
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <input type="text" name={`end_date_day[${i}]`} value={rowValues[i].end_date_day || ""} onChange={(event) => updateRow(i, "end_date_day", event.target.value)} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="DD" title="End Day" />
                  <input type="text" name={`end_date_month[${i}]`} value={rowValues[i].end_date_month || ""} onChange={(event) => updateRow(i, "end_date_month", event.target.value)} maxLength={2} className="w-[25px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="MM" title="End Month" />
                  <input type="text" name={`end_date_year[${i}]`} value={rowValues[i].end_date_year || ""} onChange={(event) => updateRow(i, "end_date_year", event.target.value)} maxLength={4} className="w-[50px] border border-gray-400 p-1 text-center outline-none bg-[#FFF0F0]" placeholder="YYYY" title="End Year" />
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
      </MembershipSaveForm>
    </div>
  );
}
