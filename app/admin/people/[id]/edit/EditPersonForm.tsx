"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import AddressMapPicker from "@/components/AddressMapPicker";

type PersonFormData = {
  id: number;
  firstName: string;
  lastName: string;
  matchName: string;
  commonName: string;
  status: string;
  placeOfBirth: string;
  countryOfBirth: string;
  nationality: string;
  gender: string;
  position: string;
  isReferee: string;
  strongFoot: string;
  height: string;
  weight: string;
  nickname: string;
  birthYear: string;
  mappingSource: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  dodDay: string;
  dodMonth: string;
  dodYear: string;
};

function splitDate(date?: string | null) {
  if (!date) return { day: "", month: "", year: "" };
  const [year, month, day] = date.split("-");
  return { day: day || "", month: month || "", year: year || "" };
}

function cmToFeetInches(cmValue: number) {
  const totalInches = cmValue / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - ft * 12);
  return { ft, inches };
}

export default function EditPersonForm({ person, action }: { person: PersonFormData; action: (formData: FormData) => void }) {
  const [status, setStatus] = useState(person.status || "active");
  const [heightCm, setHeightCm] = useState(person.height || "");
  const initialCm = Number.parseFloat(person.height || "");
  const initialFeet = Number.isFinite(initialCm) ? cmToFeetInches(initialCm) : { ft: 0, inches: 0 };
  const [heightFt, setHeightFt] = useState(Number.isFinite(initialCm) ? String(initialFeet.ft) : "");
  const [heightIn, setHeightIn] = useState(Number.isFinite(initialCm) ? String(initialFeet.inches) : "");
  const [weightKg, setWeightKg] = useState(person.weight || "");
  const initialKg = Number.parseFloat(person.weight || "");
  const [weightLbs, setWeightLbs] = useState(Number.isFinite(initialKg) ? (initialKg * 2.20462).toFixed(1) : "");

  const handleHeightCmChange = (value: string) => {
    setHeightCm(value);
    const cm = Number.parseFloat(value);
    if (!Number.isFinite(cm) || cm <= 0) {
      setHeightFt("");
      setHeightIn("");
      return;
    }
    const { ft, inches } = cmToFeetInches(cm);
    setHeightFt(String(ft));
    setHeightIn(String(inches));
  };

  const handleHeightFtInChange = (ftValue: string, inValue: string) => {
    setHeightFt(ftValue);
    setHeightIn(inValue);
    const ft = Number.parseFloat(ftValue || "0");
    const inches = Number.parseFloat(inValue || "0");
    if (!Number.isFinite(ft) && !Number.isFinite(inches)) {
      setHeightCm("");
      return;
    }
    const totalInches = (Number.isFinite(ft) ? ft * 12 : 0) + (Number.isFinite(inches) ? inches : 0);
    const cm = totalInches * 2.54;
    setHeightCm(totalInches > 0 ? String(Math.round(cm)) : "");
  };

  const handleWeightKgChange = (value: string) => {
    setWeightKg(value);
    const kg = Number.parseFloat(value);
    if (!Number.isFinite(kg) || kg <= 0) {
      setWeightLbs("");
      return;
    }
    setWeightLbs((kg * 2.20462).toFixed(1));
  };

  const handleWeightLbsChange = (value: string) => {
    setWeightLbs(value);
    const lbs = Number.parseFloat(value);
    if (!Number.isFinite(lbs) || lbs <= 0) {
      setWeightKg("");
      return;
    }
    setWeightKg((lbs / 2.20462).toFixed(1));
  };

  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Edit People (ID: {person.id})</h1>
      </div>

      <div className="bg-white border border-[#040f4f] p-4 max-w-5xl">
        <form action={action} className="space-y-4 text-sm text-[#040f4f]">
          <input type="hidden" name="id" value={person.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col"><label className="font-semibold mb-1">Firstname</label><input name="firstName" type="text" defaultValue={person.firstName} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Lastname</label><input name="lastName" type="text" defaultValue={person.lastName} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Matchname</label><input name="matchName" type="text" defaultValue={person.matchName} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Common Name</label><input name="commonName" type="text" defaultValue={person.commonName} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" /></div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Date of Birth</label>
              <div className="flex gap-2">
                <input name="dobDay" type="text" defaultValue={person.dobDay} placeholder="DD" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input name="dobMonth" type="text" defaultValue={person.dobMonth} placeholder="MM" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input name="dobYear" type="text" defaultValue={person.dobYear} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-20 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={4} />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Status</label>
              <div className="flex gap-3 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" checked={status === "active"} onChange={(e) => setStatus(e.target.value)} className="accent-[#040f4f]" /> Active</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="retired" checked={status === "retired"} onChange={(e) => setStatus(e.target.value)} className="accent-[#040f4f]" /> Retired</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="dead" checked={status === "dead"} onChange={(e) => setStatus(e.target.value)} className="accent-[#040f4f]" /> Dead</label>
              </div>
            </div>

            {status === "dead" ? (
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Date of Death</label>
                <div className="flex gap-2">
                  <input name="dodDay" type="text" defaultValue={person.dodDay} placeholder="DD" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                  <input name="dodMonth" type="text" defaultValue={person.dodMonth} placeholder="MM" className="border border-[#040f4f] p-1.5 w-12 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                  <input name="dodYear" type="text" defaultValue={person.dodYear} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-20 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={4} />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col"><label className="font-semibold mb-1">Place of Birth</label><AddressMapPicker name="placeOfBirth" valueMode="city" countryFieldName="countryOfBirth" defaultValue={person.placeOfBirth} placeholder="Place of Birth" className="outline-none focus:ring-1 focus:ring-[#040f4f] w-full" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Country of Birth</label><select name="countryOfBirth" defaultValue={person.countryOfBirth} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]"><option value=""></option>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Nationality</label><select name="nationality" defaultValue={person.nationality} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]"><option value=""></option>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>

            <div className="flex flex-col"><label className="font-semibold mb-1">Gender</label><div className="flex gap-4 mt-1"><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="male" defaultChecked={person.gender === "male"} className="accent-[#040f4f]" /> Male</label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="female" defaultChecked={person.gender === "female"} className="accent-[#040f4f]" /> Female</label></div></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Position</label><select name="position" defaultValue={person.position} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]"><option value="">Position</option><option value="Goalkeeper">Goalkeeper</option><option value="Defender">Defender</option><option value="Midfielder">Midfielder</option><option value="Forward">Forward</option></select></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Referee</label><div className="flex gap-4 mt-1"><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="referee" value="yes" defaultChecked={person.isReferee === "yes"} className="accent-[#040f4f]" /> Yes</label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="referee" value="no" defaultChecked={person.isReferee !== "yes"} className="accent-[#040f4f]" /> No</label></div></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Strong Foot</label><div className="flex gap-3 mt-1"><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="foot" value="left" defaultChecked={person.strongFoot === "left"} className="accent-[#040f4f]" /> Left</label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="foot" value="right" defaultChecked={person.strongFoot === "right"} className="accent-[#040f4f]" /> Right</label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="foot" value="both" defaultChecked={person.strongFoot === "both"} className="accent-[#040f4f]" /> Both</label></div></div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Height</label>
              <div className="flex gap-2">
                <input type="number" name="height" value={heightCm} onChange={(e) => handleHeightCmChange(e.target.value)} placeholder="cm" className="border border-[#040f4f] p-1.5 w-16 outline-none focus:ring-1 focus:ring-[#040f4f]" />
                <input type="number" value={heightFt} onChange={(e) => handleHeightFtInChange(e.target.value, heightIn)} placeholder="ft" className="border border-[#040f4f] p-1.5 w-16 outline-none focus:ring-1 focus:ring-[#040f4f]" />
                <input type="number" value={heightIn} onChange={(e) => handleHeightFtInChange(heightFt, e.target.value)} placeholder="in" className="border border-[#040f4f] p-1.5 w-16 outline-none focus:ring-1 focus:ring-[#040f4f]" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Weight</label>
              <div className="flex gap-2">
                <input type="number" name="weight" value={weightKg} onChange={(e) => handleWeightKgChange(e.target.value)} placeholder="kg" className="border border-[#040f4f] p-1.5 w-20 outline-none focus:ring-1 focus:ring-[#040f4f]" />
                <input type="number" value={weightLbs} onChange={(e) => handleWeightLbsChange(e.target.value)} placeholder="lbs" className="border border-[#040f4f] p-1.5 w-20 outline-none focus:ring-1 focus:ring-[#040f4f]" />
              </div>
            </div>

            <div className="flex flex-col"><label className="font-semibold mb-1">Nickname</label><input name="nickname" type="text" defaultValue={person.nickname} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Birth Year</label><input name="birthYear" type="number" defaultValue={person.birthYear} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" placeholder="YYYY" /></div>
            <div className="flex flex-col"><label className="font-semibold mb-1">Mapping Source</label><select name="mappingSource" defaultValue={person.mappingSource} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]"><option value=""></option><option value="system">System</option><option value="manual">Manual</option><option value="external">External API</option></select></div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#040f4f]">
            <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-8 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">Update Data</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { splitDate };
