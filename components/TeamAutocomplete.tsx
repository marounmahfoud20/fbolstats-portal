"use client";

import { useState, useEffect, useRef } from "react";
import { searchTeams } from "@/lib/actions";

// ADDED: gender prop to accept the toggle state from the parent page
export default function TeamAutocomplete({ gender = "male" }: { gender?: string }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ id: number; name: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedTeamId("");

        if (value.length >= 2) {
            // ADDED: Pass the gender filter to the backend search
            const teams = await searchTeams(value, gender);
            setResults(teams);
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const handleSelectTeam = (teamId: number, teamName: string) => {
        setQuery(teamName);
        setSelectedTeamId(teamId);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input type="hidden" name="teamId" value={selectedTeamId} required />

            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={`Search ${gender === 'female' ? "Women's" : "Men's"} teams...`}
                className="w-full border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]"
                autoComplete="off"
            />

            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-[#040f4f] border-t-0 max-h-60 overflow-y-auto shadow-lg">
                    {results.map((team) => (
                        <li
                            key={team.id}
                            onClick={() => handleSelectTeam(team.id, team.name)}
                            className="p-2 text-sm cursor-pointer hover:bg-[#f4a01c] hover:text-[#040f4f] text-gray-800 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <span className="font-bold">{team.name}</span> <span className="text-gray-500 text-xs">({team.id})</span>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && (
                <div className="absolute z-50 w-full bg-white border border-[#040f4f] border-t-0 p-2 text-sm text-gray-500 shadow-lg">
                    No {gender === 'female' ? "women's" : "men's"} teams found.
                </div>
            )}
        </div>
    );
}