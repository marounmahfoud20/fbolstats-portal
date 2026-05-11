"use client";

import { useMemo, useState } from "react";
import { saveGroupName, saveMatchCore, saveMatchEventEntry, saveMatchMeta, saveMatchReferees, saveMatchShirtNumber } from "@/lib/match-actions";

type Person = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  commonName: string | null;
  position: string | null;
  nationality: string | null;
};
type Appearance = { id: number; role: string; teamId: number | null; person: Person; teamName: string | null; teamLogo: string | null };

type SelectedPlayer = {
  id: number;
  teamName: string;
  name: string;
  teamId: number | null;
};

type PlayerEventType = "goal" | "own_goal" | "penalty_goal" | "penalty_missed" | "yellow_card" | "second_yellow" | "red_card";

const EVENT_OPTIONS: { key: PlayerEventType; iconSrc: string; title: string }[] = [
  { key: "goal", iconSrc: "/Goal.png", title: "Goal" },
  { key: "own_goal", iconSrc: "/Own Goal.png", title: "Own Goal" },
  { key: "penalty_goal", iconSrc: "/Penalty.png", title: "Penalty Goal" },
  { key: "penalty_missed", iconSrc: "/Missed Penalty.png", title: "Penalty Missed" },
  { key: "yellow_card", iconSrc: "/Yellow_card_icon.svg.png", title: "Yellow Card" },
  { key: "second_yellow", iconSrc: "/Yellow to Red.png", title: "Second Yellow Card" },
  { key: "red_card", iconSrc: "/Red_card.svg.png", title: "Red Card" },
];

const GOAL_TYPES = ["Right Foot", "Left Foot", "Head", "Corner", "Free Kick", "Other"] as const;

const BOOKING_REASONS = [
  "",
  "Arguing with officials",
  "Argument",
  "Climbing fence",
  "Dangerous play",
  "Deliberate time wasting tactics",
  "Dissent",
  "Encroachment",
  "Entering field",
  "Entering referee review area",
  "Entering video operations room",
  "Excessive / unnecessary violence",
  "Excessive celebration",
  "Excessive usage of review signal",
  "Foul",
  "Foul and Abusive Language",
  "Handball",
  "Improper holding",
  "Injuring",
  "Interference",
  "Leaving field",
  "Not Retreating",
  "Off the ball foul",
  "Other",
  "Other reason",
  "Persistent Infringement",
  "Professional foul",
  "Professional Foul Handball",
  "Professional Foul Last Man",
  "Pulling of clothes",
  "Serious Foul",
  "Simulation",
  "Spitting",
  "Time wasting",
  "Violent Conduct",
] as const;

const COUNTRY_TO_CODE: Record<string, string> = {
  lebanon: "LB", syria: "SY", iraq: "IQ", iran: "IR", jordan: "JO", palestine: "PS", saudi: "SA", egypt: "EG", morocco: "MA", algeria: "DZ", tunisia: "TN", france: "FR", germany: "DE", spain: "ES", italy: "IT", portugal: "PT", brazil: "BR", argentina: "AR", nigeria: "NG", ghana: "GH", kenya: "KE",
};

function codeToFlag(code: string) {
  const up = code.toUpperCase();
  if (up.length !== 2) return "??";
  return String.fromCodePoint(...[...up].map((c) => 127397 + c.charCodeAt(0)));
}

function nationalityFlag(nationality: string | null) {
  if (!nationality) return "??";
  const key = nationality.toLowerCase();
  const code = COUNTRY_TO_CODE[key] || (nationality.length === 2 ? nationality.toUpperCase() : "");
  return code ? codeToFlag(code) : "??";
}

function displayName(person: Person) {
  return person.commonName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || `Player ${person.id}`;
}

function posShort(position: string | null) {
  if (!position) return "-";
  const p = position.toLowerCase();
  if (p.includes("goal")) return "GK";
  if (p.includes("def")) return "DF";
  if (p.includes("mid")) return "MF";
  if (p.includes("att") || p.includes("forw") || p.includes("wing") || p.includes("strik")) return "FW";
  return "-";
}

function minuteValue(minute: string | null, extraTime: string | null) {
  const m = Number.parseInt(minute || "", 10);
  const e = Number.parseInt(extraTime || "", 10);
  const base = Number.isFinite(m) ? m : 0;
  const extra = Number.isFinite(e) ? e : 0;
  return Math.max(0, base + extra);
}

function eventHalf(minute: string | null, extraTime: string | null): "1st" | "2nd" {
  return minuteValue(minute, extraTime) >= 46 ? "2nd" : "1st";
}

export default function MatchDetailsEditor({
  match,
  appearances,
  refereeOptions,
  venueOptions,
  initialMeta,
  initialEvents,
  initialShirts,
}: {
  match: {
    id: number;
    groupId: number;
    teamA: string;
    teamB: string;
    date: string | null;
    time: string | null;
    status: string;
    venue: string | null;
    roundName: string;
    teamALogo: string | null;
    teamBLogo: string | null;
  };
  appearances: Appearance[];
  refereeOptions: { id: number; name: string }[];
  venueOptions: string[];
  initialMeta: {
    spectators: string | null;
    ftA: string | null;
    ftB: string | null;
    htA: string | null;
    htB: string | null;
    etA: string | null;
    etB: string | null;
    pkA: string | null;
    pkB: string | null;
  } | null;
  initialEvents: {
    id: number;
    personId: number;
    assistPersonId: number | null;
    teamId: number | null;
    eventType: string;
    minute: string | null;
    extraTime: string | null;
    goalType: string | null;
    bookingReason: string | null;
    playerName: string;
    assistPlayerName: string | null;
    teamName: string | null;
  }[];
  initialShirts: Record<number, string>;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState({ date: match.date || "", time: match.time || "", round: match.roundName, status: match.status || "" });
  const [extras, setExtras] = useState({ venue: match.venue || "", spectators: initialMeta?.spectators || "" });
  const [scores, setScores] = useState({
    ftA: initialMeta?.ftA || "",
    ftB: initialMeta?.ftB || "",
    htA: initialMeta?.htA || "",
    htB: initialMeta?.htB || "",
    etA: initialMeta?.etA || "",
    etB: initialMeta?.etB || "",
    pkA: initialMeta?.pkA || "",
    pkB: initialMeta?.pkB || "",
  });

  const [shirtNumbers, setShirtNumbers] = useState<Record<number, string>>(initialShirts || {});
  const [editingShirt, setEditingShirt] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlayerEventType>((initialEvents[0]?.eventType as PlayerEventType) || "goal");
  const [eventMinute, setEventMinute] = useState("");
  const [eventExtraTime, setEventExtraTime] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [assistPersonId, setAssistPersonId] = useState<string>("");
  const [goalType, setGoalType] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>("");
  const [eventRows, setEventRows] = useState(initialEvents);

  const lineups = useMemo(() => {
    const teamAAppearances = appearances.filter((a) => a.teamName === match.teamA);
    const teamBAppearances = appearances.filter((a) => a.teamName === match.teamB);
    const refs = appearances.filter((a) => a.teamId === null || a.role.toLowerCase().includes("referee") || a.role.includes("Assistant") || a.role.includes("4th"));

    return {
      teamA: {
        starters: teamAAppearances.filter((a) => a.role === "Starter"),
        subs: teamAAppearances.filter((a) => a.role === "Substitute"),
        coaches: teamAAppearances.filter((a) => a.role.toLowerCase().includes("coach")),
      },
      teamB: {
        starters: teamBAppearances.filter((a) => a.role === "Starter"),
        subs: teamBAppearances.filter((a) => a.role === "Substitute"),
        coaches: teamBAppearances.filter((a) => a.role.toLowerCase().includes("coach")),
      },
      referees: {
        main: refs.find((r) => r.role === "Main Referee" || r.role === "Referee"),
        a1: refs.find((r) => r.role === "Assistant 1"),
        a2: refs.find((r) => r.role === "Assistant 2"),
        fourth: refs.find((r) => r.role === "4th Official"),
      },
    };
  }, [appearances, match.teamA, match.teamB]);

  const [refInputs, setRefInputs] = useState({
    main: lineups.referees.main ? displayName(lineups.referees.main.person) : "",
    a1: lineups.referees.a1 ? displayName(lineups.referees.a1.person) : "",
    a2: lineups.referees.a2 ? displayName(lineups.referees.a2.person) : "",
    fourth: lineups.referees.fourth ? displayName(lineups.referees.fourth.person) : "",
  });

  const findRefId = (name: string) => {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return null;
    const exact = refereeOptions.find((r) => r.name.toLowerCase() === cleaned);
    if (exact) return exact.id;
    const partial = refereeOptions.filter((r) => r.name.toLowerCase().includes(cleaned));
    return partial.length === 1 ? partial[0].id : null;
  };

  const persistMatchInfo = async () => {
    try {
      setSaving("info");
      await saveMatchCore(match.id, { date: matchInfo.date, time: matchInfo.time, status: matchInfo.status });
      await saveGroupName(match.groupId, matchInfo.round, match.id);
    } finally {
      setSaving(null);
    }
  };

  const persistExtras = async () => {
    try {
      setSaving("extras");
      await saveMatchCore(match.id, { venue: extras.venue });
      await saveMatchMeta(match.id, { spectators: extras.spectators });
    } finally {
      setSaving(null);
    }
  };

  const persistScores = async () => {
    try {
      setSaving("scores");
      await saveMatchMeta(match.id, scores);
    } finally {
      setSaving(null);
    }
  };

  const persistReferees = async () => {
    const mainRefId = findRefId(refInputs.main);
    const a1RefId = findRefId(refInputs.a1);
    const a2RefId = findRefId(refInputs.a2);
    const fourthRefId = findRefId(refInputs.fourth);
    const hasInvalidInput =
      (!!refInputs.main.trim() && !mainRefId) ||
      (!!refInputs.a1.trim() && !a1RefId) ||
      (!!refInputs.a2.trim() && !a2RefId) ||
      (!!refInputs.fourth.trim() && !fourthRefId);

    if (hasInvalidInput) {
      alert("One or more referee names did not match exactly. Please pick from the dropdown suggestions.");
      return;
    }

    try {
      setSaving("refs");
      await saveMatchReferees(match.id, {
        mainRefereeId: mainRefId,
        assistant1Id: a1RefId,
        assistant2Id: a2RefId,
        fourthOfficialId: fourthRefId,
      });
    } finally {
      setSaving(null);
    }
  };

  const eventIconSrc = (eventType: string) => EVENT_OPTIONS.find((e) => e.key === eventType)?.iconSrc || "";

  const supportsAssist = selectedEvent === "goal";
  const supportsGoalType = selectedEvent === "goal" || selectedEvent === "own_goal" || selectedEvent === "penalty_goal";
  const supportsBookingReason = selectedEvent === "yellow_card" || selectedEvent === "second_yellow" || selectedEvent === "red_card";

  const assistOptions = useMemo(() => {
    if (!selectedPlayer) return [];
    return appearances
      .filter(
        (a) =>
          a.teamId !== null &&
          a.teamId === selectedPlayer.teamId &&
          (a.role === "Starter" || a.role === "Substitute") &&
          a.person.id !== selectedPlayer.id
      )
      .map((a) => ({
        id: a.person.id,
        label: displayName(a.person),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [appearances, selectedPlayer]);

  const persistEvent = async () => {
    if (!selectedPlayer) return;
    const playerAppearance = appearances.find((a) => a.person.id === selectedPlayer.id && a.teamId !== null);
    const assistName = assistOptions.find((a) => String(a.id) === assistPersonId)?.label || null;
    await saveMatchEventEntry(match.id, {
      eventId: editingEventId,
      personId: selectedPlayer.id,
      assistPersonId: supportsAssist && assistPersonId ? parseInt(assistPersonId) : null,
      teamId: playerAppearance?.teamId ?? null,
      eventType: selectedEvent,
      minute: eventMinute,
      extraTime: eventExtraTime,
      goalType: supportsGoalType ? goalType : "",
      bookingReason: supportsBookingReason ? bookingReason : "",
    });
    setEventRows((prev) => {
      const nextItem = {
        id: editingEventId || Date.now(),
        personId: selectedPlayer.id,
        assistPersonId: supportsAssist && assistPersonId ? parseInt(assistPersonId) : null,
        teamId: playerAppearance?.teamId ?? null,
        eventType: selectedEvent,
        minute: eventMinute || null,
        extraTime: eventExtraTime || null,
        goalType: supportsGoalType ? goalType || null : null,
        bookingReason: supportsBookingReason ? bookingReason || null : null,
        playerName: selectedPlayer.name,
        assistPlayerName: assistName,
        teamName: selectedPlayer.teamName,
      };
      if (!editingEventId) return [nextItem, ...prev];
      return prev.map((x) => (x.id === editingEventId ? nextItem : x));
    });
    setEventMinute("");
    setEventExtraTime("");
    setAssistPersonId("");
    setGoalType("");
    setBookingReason("");
    setEditingEventId(null);
    setSelectedPlayer(null);
  };

  const persistShirts = (next: Record<number, string>) => {
    setShirtNumbers(next);
  };

  const sortedEventRows = useMemo(
    () => [...eventRows].sort((a, b) => minuteValue(b.minute, b.extraTime) - minuteValue(a.minute, a.extraTime)),
    [eventRows]
  );
  const secondHalfEvents = useMemo(() => sortedEventRows.filter((e) => eventHalf(e.minute, e.extraTime) === "2nd"), [sortedEventRows]);
  const firstHalfEvents = useMemo(() => sortedEventRows.filter((e) => eventHalf(e.minute, e.extraTime) === "1st"), [sortedEventRows]);

  const renderEventPlayerText = (ev: (typeof eventRows)[number]) => {
    if (ev.assistPlayerName && (ev.eventType === "goal" || ev.eventType === "penalty_goal" || ev.eventType === "own_goal")) {
      return `${ev.playerName}  |  ${ev.assistPlayerName}`;
    }
    return ev.playerName;
  };

  const renderShirtCell = (personId: number) => {
    if (editingShirt === personId) {
      return (
        <input
          autoFocus
          maxLength={3}
          value={shirtNumbers[personId] || ""}
          onChange={(e) => persistShirts({ ...shirtNumbers, [personId]: e.target.value })}
          onBlur={() => {
            void saveMatchShirtNumber(match.id, personId, shirtNumbers[personId] || "");
            setEditingShirt(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = shirtNumbers[personId] || "";
              void saveMatchShirtNumber(match.id, personId, value);
              setEditingShirt(null);
            }
          }}
          className="w-8 text-center font-bold bg-white border border-blue-500"
        />
      );
    }
    return (
      <button type="button" className="w-8 text-center font-bold bg-white border border-gray-300" onClick={() => setEditingShirt(personId)} title="Click to edit shirt number">
        {shirtNumbers[personId] || ""}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-200 shadow-sm p-3">
      <datalist id="referee-list">
        {refereeOptions.map((ref) => <option key={ref.id} value={ref.name} />)}
      </datalist>
      <datalist id="venue-list">
        {venueOptions.map((venue) => <option key={venue} value={venue} />)}
      </datalist>

      <div className="flex gap-3 items-start text-[13px]">
        <div className="w-[320px] flex flex-col gap-3">
          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="bg-[#dfdfdf] border-b border-[#c50000] text-center text-[22px] font-bold py-1">Match Info</div>
            <form className="p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); void persistMatchInfo(); }}>
              <div className="flex items-center gap-1"><span className="w-16 font-bold">Date</span><input value={matchInfo.date} onChange={(e) => setMatchInfo((p) => ({ ...p, date: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 h-6" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
              <div className="flex items-center gap-1"><span className="w-16 font-bold">Time</span><input value={matchInfo.time} onChange={(e) => setMatchInfo((p) => ({ ...p, time: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 h-6" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
              <div className="flex items-center gap-1"><span className="w-16 font-bold">Round</span><input value={matchInfo.round} onChange={(e) => setMatchInfo((p) => ({ ...p, round: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 h-6" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
              <div className="flex items-center gap-1">
                <span className="w-16 font-bold">Status</span>
                <select
                  value={matchInfo.status}
                  onChange={(e) => setMatchInfo((p) => ({ ...p, status: e.target.value }))}
                  className="border border-gray-400 px-1 py-0.5 flex-1 h-6 bg-white"
                >
                  <option value="Played">Played</option>
                  <option value="Playing">Playing</option>
                  <option value="Fixture">Fixture</option>
                  <option value="Awarded">Awarded</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Break">Break</option>
                </select>
                <button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button>
              </div>
            </form>
          </div>

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="bg-[#dfdfdf] border-b border-[#c50000] text-center text-[22px] font-bold py-1">Match Extras</div>
            <form className="p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); void persistExtras(); }}>
              <div className="flex items-center gap-1"><span className="w-16 font-bold">Venue</span><input list="venue-list" value={extras.venue} onChange={(e) => setExtras((p) => ({ ...p, venue: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 h-6" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
              <div className="flex items-center gap-1"><span className="w-16 font-bold">Specs</span><input value={extras.spectators} onChange={(e) => setExtras((p) => ({ ...p, spectators: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 h-6" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
            </form>
          </div>

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="bg-[#dfdfdf] border-b border-[#c50000] text-center text-[22px] font-bold py-1">Scores</div>
            <form className="p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); persistScores(); }}>
              {(["FT", "HT", "ET", "PK"] as const).map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="w-10 font-bold">{k}</span>
                  <input value={scores[`${k.toLowerCase()}A` as keyof typeof scores]} onChange={(e) => setScores((p) => ({ ...p, [`${k.toLowerCase()}A`]: e.target.value }))} className="border border-gray-400 px-1 h-6 w-12 text-center" placeholder="A" />
                  <input value={scores[`${k.toLowerCase()}B` as keyof typeof scores]} onChange={(e) => setScores((p) => ({ ...p, [`${k.toLowerCase()}B`]: e.target.value }))} className="border border-gray-400 px-1 h-6 w-12 text-center" placeholder="B" />
                  <button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button>
                </div>
              ))}
            </form>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="border border-[#c50000] bg-[#1f2937] h-[60px] flex rounded-md overflow-hidden text-white shadow">
            <div className="flex-1 flex items-center justify-center gap-2 font-bold text-[24px] px-2">{match.teamALogo ? <img src={match.teamALogo} alt={match.teamA} className="w-9 h-9 object-contain" /> : null}<span>{match.teamA}</span></div>
            <div className="w-[80px] bg-[#374151] flex items-center justify-center font-bold text-[20px]">vs</div>
            <div className="flex-1 flex items-center justify-center gap-2 font-bold text-[24px] px-2"><span>{match.teamB}</span>{match.teamBLogo ? <img src={match.teamBLogo} alt={match.teamB} className="w-9 h-9 object-contain" /> : null}</div>
          </div>

          {selectedPlayer ? (
            <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
              <div className="bg-[#dbeafe] border-b border-[#c50000] text-[20px] font-bold px-3 py-1">Add/Edit Match Event</div>
              <form className="p-2 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void persistEvent(); }}>
                <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
                  <span className="font-bold min-w-fit">{selectedPlayer.name}</span>
                  {EVENT_OPTIONS.map((event) => (
                    <label key={event.key} className="flex items-center gap-1 min-w-fit" title={event.title}>
                      <input type="radio" name="player-event-type" checked={selectedEvent === event.key} onChange={() => setSelectedEvent(event.key)} />
                      <img src={event.iconSrc} alt={event.title} className="w-5 h-5 object-contain" />
                    </label>
                  ))}
                  <span className="font-bold">M</span><input value={eventMinute} onChange={(e) => setEventMinute(e.target.value)} className="w-12 border border-gray-400 px-1 h-6" />
                  <span className="font-bold">E</span><input value={eventExtraTime} onChange={(e) => setEventExtraTime(e.target.value)} className="w-10 border border-gray-400 px-1 h-6" />
                  <button type="submit" className="h-6 px-3 border border-gray-500 bg-[#efefef] font-bold text-[12px]">Save</button>
                </div>
                {(supportsAssist || supportsGoalType || supportsBookingReason) ? (
                  <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
                    {supportsAssist ? (
                      <>
                        <img src="/Assist.png" alt="Assist" className="w-5 h-5 object-contain" />
                        <select value={assistPersonId} onChange={(e) => setAssistPersonId(e.target.value)} className="h-6 border border-gray-400 px-1 min-w-[180px]">
                          <option value=""></option>
                          {assistOptions.map((a) => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    {supportsGoalType ? (
                      <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="h-6 border border-gray-400 px-1 min-w-[140px]">
                        <option value="">Goal Type</option>
                        {GOAL_TYPES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    ) : null}
                    {supportsBookingReason ? (
                      <select value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} className="h-6 border border-gray-400 px-1 min-w-[220px]">
                        {BOOKING_REASONS.map((r) => (
                          <option key={r || "__empty"} value={r}>{r || "Booking Reason"}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}
              </form>
            </div>
          ) : null}

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="bg-[#f3f4f6] border-b border-[#c50000] text-left text-[20px] font-bold px-3 py-1">Match Events</div>
            <div className="p-3">
              {eventRows.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No match events yet.</div>
              ) : (
                <div className="border border-gray-200 rounded overflow-hidden text-[12px]">
                  <div className="w-full text-center leading-6 bg-[#dedede] font-bold">2nd Half</div>
                  {secondHalfEvents.map((ev, idx) => {
                    const isLeft = ev.teamName === match.teamA;
                    return (
                      <div key={`sh-${ev.id}-${idx}`} className="grid grid-cols-[1fr_26px_64px_26px_1fr] items-center border-b border-gray-100 min-h-8">
                        <span className="px-2 text-right">{isLeft ? renderEventPlayerText(ev) : "\u00A0"}</span>
                        <span className="flex items-center justify-center">{isLeft && eventIconSrc(ev.eventType) ? <img src={eventIconSrc(ev.eventType)} alt={ev.eventType} className="w-4 h-4 object-contain" /> : "\u00A0"}</span>
                        <button
                          type="button"
                          className="text-center font-bold text-gray-800 hover:underline"
                          onClick={() => {
                            const p = appearances.find((a) => a.person.id === ev.personId && a.teamName === ev.teamName);
                            setSelectedPlayer({
                              id: ev.personId,
                              name: ev.playerName,
                              teamName: ev.teamName || "",
                              teamId: p?.teamId ?? null,
                            });
                            setEditingEventId(ev.id);
                            setSelectedEvent(ev.eventType as PlayerEventType);
                            setEventMinute(ev.minute || "");
                            setEventExtraTime(ev.extraTime || "");
                            setAssistPersonId(ev.assistPersonId ? String(ev.assistPersonId) : "");
                            setGoalType(ev.goalType || "");
                            setBookingReason(ev.bookingReason || "");
                          }}
                        >
                          {`${ev.minute || "0"}${ev.extraTime ? `+${ev.extraTime}` : ""}'`}
                        </button>
                        <span className="flex items-center justify-center">{!isLeft && eventIconSrc(ev.eventType) ? <img src={eventIconSrc(ev.eventType)} alt={ev.eventType} className="w-4 h-4 object-contain" /> : "\u00A0"}</span>
                        <span className="px-2">{!isLeft ? renderEventPlayerText(ev) : "\u00A0"}</span>
                      </div>
                    );
                  })}

                  <div className="w-full text-center leading-6 bg-[#dedede] font-bold">1st Half</div>
                  {firstHalfEvents.map((ev, idx) => {
                    const isLeft = ev.teamName === match.teamA;
                    return (
                      <div key={`fh-${ev.id}-${idx}`} className="grid grid-cols-[1fr_26px_64px_26px_1fr] items-center border-b border-gray-100 min-h-8">
                        <span className="px-2 text-right">{isLeft ? renderEventPlayerText(ev) : "\u00A0"}</span>
                        <span className="flex items-center justify-center">{isLeft && eventIconSrc(ev.eventType) ? <img src={eventIconSrc(ev.eventType)} alt={ev.eventType} className="w-4 h-4 object-contain" /> : "\u00A0"}</span>
                        <button
                          type="button"
                          className="text-center font-bold text-gray-800 hover:underline"
                          onClick={() => {
                            const p = appearances.find((a) => a.person.id === ev.personId && a.teamName === ev.teamName);
                            setSelectedPlayer({
                              id: ev.personId,
                              name: ev.playerName,
                              teamName: ev.teamName || "",
                              teamId: p?.teamId ?? null,
                            });
                            setEditingEventId(ev.id);
                            setSelectedEvent(ev.eventType as PlayerEventType);
                            setEventMinute(ev.minute || "");
                            setEventExtraTime(ev.extraTime || "");
                            setAssistPersonId(ev.assistPersonId ? String(ev.assistPersonId) : "");
                            setGoalType(ev.goalType || "");
                            setBookingReason(ev.bookingReason || "");
                          }}
                        >
                          {`${ev.minute || "0"}${ev.extraTime ? `+${ev.extraTime}` : ""}'`}
                        </button>
                        <span className="flex items-center justify-center">{!isLeft && eventIconSrc(ev.eventType) ? <img src={eventIconSrc(ev.eventType)} alt={ev.eventType} className="w-4 h-4 object-contain" /> : "\u00A0"}</span>
                        <span className="px-2">{!isLeft ? renderEventPlayerText(ev) : "\u00A0"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden shadow-sm">
            <div className="bg-[#f3f4f6] border-b border-[#c50000] text-left text-[24px] font-bold px-4 py-1">Lineups</div>
            <div className="p-2 space-y-1 text-[14px]">
              {Array.from({ length: Math.max(lineups.teamA.starters.length, lineups.teamB.starters.length) }).map((_, i) => {
                const left = lineups.teamA.starters[i] || null;
                const right = lineups.teamB.starters[i] || null;
                const leftName = left ? displayName(left.person) : "";
                const rightName = right ? displayName(right.person) : "";
                const leftPos = left ? posShort(left.person.position) : "";
                const rightPos = right ? posShort(right.person.position) : "";
                const leftFlag = left ? nationalityFlag(left.person.nationality) : "";
                const rightFlag = right ? nationalityFlag(right.person.nationality) : "";
                return (
                  <div key={`starter-${i}`} className="grid grid-cols-[274px_30px_28px_32px_18px_32px_28px_30px_274px] items-center leading-6">
                    <span className="text-right">
                      {left ? <button type="button" onClick={() => setSelectedPlayer({ id: left.person.id, name: leftName, teamName: left.teamName || "", teamId: left.teamId })} className="hover:underline">{leftName}</button> : "\u00A0"}
                    </span>
                    <span className="text-center font-bold">{leftPos || "\u00A0"}</span>
                    <span className="text-center">{leftFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{left ? renderShirtCell(left.person.id) : "\u00A0"}</span>
                    <span className="text-left">&nbsp;</span>
                    <span className="text-center font-bold">{right ? renderShirtCell(right.person.id) : "\u00A0"}</span>
                    <span className="text-center">{rightFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{rightPos || "\u00A0"}</span>
                    <span className="text-left">
                      {right ? <button type="button" onClick={() => setSelectedPlayer({ id: right.person.id, name: rightName, teamName: right.teamName || "", teamId: right.teamId })} className="hover:underline">{rightName}</button> : "\u00A0"}
                    </span>
                  </div>
                );
              })}

              {Array.from({ length: Math.max(lineups.teamA.subs.length, lineups.teamB.subs.length) }).map((_, i) => {
                const left = lineups.teamA.subs[i] || null;
                const right = lineups.teamB.subs[i] || null;
                const leftName = left ? displayName(left.person) : "";
                const rightName = right ? displayName(right.person) : "";
                const leftPos = left ? posShort(left.person.position) : "";
                const rightPos = right ? posShort(right.person.position) : "";
                const leftFlag = left ? nationalityFlag(left.person.nationality) : "";
                const rightFlag = right ? nationalityFlag(right.person.nationality) : "";
                return (
                  <div key={`sub-${i}`} className="grid grid-cols-[274px_30px_28px_32px_18px_32px_28px_30px_274px] items-center leading-6 bg-gray-50">
                    <span className="text-right">
                      {left ? <button type="button" onClick={() => setSelectedPlayer({ id: left.person.id, name: leftName, teamName: left.teamName || "", teamId: left.teamId })} className="hover:underline">{leftName}</button> : "\u00A0"}
                    </span>
                    <span className="text-center font-bold">{leftPos || "\u00A0"}</span>
                    <span className="text-center">{leftFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{left ? renderShirtCell(left.person.id) : "\u00A0"}</span>
                    <span className="text-left">&nbsp;</span>
                    <span className="text-center font-bold">{right ? renderShirtCell(right.person.id) : "\u00A0"}</span>
                    <span className="text-center">{rightFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{rightPos || "\u00A0"}</span>
                    <span className="text-left">
                      {right ? <button type="button" onClick={() => setSelectedPlayer({ id: right.person.id, name: rightName, teamName: right.teamName || "", teamId: right.teamId })} className="hover:underline">{rightName}</button> : "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#c50000] px-4 py-3">
              <div className="font-bold text-[20px] mb-2">Referees</div>
              <form className="grid grid-cols-2 gap-2 text-[14px]" onSubmit={(e) => { e.preventDefault(); void persistReferees(); }}>
                <div className="flex items-center gap-1"><b>R:</b><input list="referee-list" value={refInputs.main} onChange={(e) => setRefInputs((p) => ({ ...p, main: e.target.value }))} className="border border-gray-400 h-6 px-1 flex-1" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
                <div className="flex items-center gap-1"><b>A1:</b><input list="referee-list" value={refInputs.a1} onChange={(e) => setRefInputs((p) => ({ ...p, a1: e.target.value }))} className="border border-gray-400 h-6 px-1 flex-1" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
                <div className="flex items-center gap-1"><b>A2:</b><input list="referee-list" value={refInputs.a2} onChange={(e) => setRefInputs((p) => ({ ...p, a2: e.target.value }))} className="border border-gray-400 h-6 px-1 flex-1" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
                <div className="flex items-center gap-1"><b>4th:</b><input list="referee-list" value={refInputs.fourth} onChange={(e) => setRefInputs((p) => ({ ...p, fourth: e.target.value }))} className="border border-gray-400 h-6 px-1 flex-1" /><button type="submit" className="h-6 px-2 border border-gray-500 bg-[#efefef] text-[11px] font-bold">Save</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {saving ? <div className="text-xs text-slate-500 mt-2">Saving...</div> : null}
    </div>
  );
}
