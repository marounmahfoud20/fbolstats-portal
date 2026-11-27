"use client";

import { useMemo, useRef, useState } from "react";
import { saveMatchDetails, saveMatchEventEntry, saveMatchMeta, saveMatchReferees, saveMatchSubstitution } from "@/lib/match-actions";
import MatchShirtNumberEditor from "@/components/MatchShirtNumberEditor";
import { shirtNumberOrder } from "@/lib/edition-shirt-numbers";
import { combineGoalAndAssistEvents } from "@/lib/goal-assist-events";
import { isSubstitutionIn, matchTime, playersOnField } from "@/lib/substitutions";
import { saveTeamOwnGoal } from "@/lib/team-own-goal-actions";
import MatchNoteForm from "./MatchNoteForm";

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

type PlayerEventType = "goal" | "own_goal" | "penalty_goal" | "penalty_missed" | "yellow_card" | "second_yellow" | "red_card" | "assist" | "sub_in" | "sub_out";

const EVENT_OPTIONS: { key: PlayerEventType; iconSrc: string; title: string }[] = [
  { key: "goal", iconSrc: "/Goal.png", title: "Goal" },
  { key: "own_goal", iconSrc: "/Own Goal.png", title: "Own Goal" },
  { key: "penalty_goal", iconSrc: "/Penalty.png", title: "Penalty Goal" },
  { key: "penalty_missed", iconSrc: "/Missed Penalty.png", title: "Penalty Missed" },
  { key: "yellow_card", iconSrc: "/Yellow_card_icon.svg.png", title: "Yellow Card" },
  { key: "second_yellow", iconSrc: "/Yellow to Red.png", title: "Second Yellow Card" },
  { key: "red_card", iconSrc: "/Red_card.svg.png", title: "Red Card" },
  { key: "assist", iconSrc: "/Assist.png", title: "Assist" },
  { key: "sub_in", iconSrc: "/subin.png", title: "Substitution In" },
  { key: "sub_out", iconSrc: "/subout.png", title: "Substitution Out" },
];

const GOAL_TYPES = ["Right Foot", "Left Foot", "Head", "Corner", "Free Kick", "Other"] as const;
const SUBSTITUTION_REASONS = ["Injury", "Resting", "Tactical", "Special Achievements"];

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
  const time = matchTime(minute || "", extraTime || "");
  return time ? time[0] * 1000 + time[1] : 0;
}

function eventHalf(minute: string | null, extraTime: string | null): "1st" | "2nd" {
  return (matchTime(minute || "", extraTime || "")?.[0] || 0) >= 46 ? "2nd" : "1st";
}

export default function MatchDetailsEditor({
  match,
  appearances,
  refereeOptions,
  venueOptions,
  initialMeta,
  initialEvents,
  initialShirts,
  initialNote,
}: {
  match: {
    id: number;
    teamA: string;
    teamB: string;
    teamAId: number | null;
    teamBId: number | null;
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
    personId: number | null;
    assistPersonId: number | null;
    teamId: number | null;
    eventType: string;
    minute: string | null;
    extraTime: string | null;
    goalType: string | null;
    bookingReason: string | null;
    substitutionId: string | null;
    substitutionReason: string | null;
    playerName: string;
    assistPlayerName: string | null;
    teamName: string | null;
  }[];
  initialShirts: Record<number, string>;
  initialNote: string | null;
}) {
  const savesInProgress = useRef({ scores: false, details: false, referees: false, event: false, substitution: false, ownGoal: false });
  const [savingScores, setSavingScores] = useState(false);
  const [scoresError, setScoresError] = useState("");
  const [detailsStatus, setDetailsStatus] = useState<"saving" | "saved" | "error" | null>(null);
  const [refereesStatus, setRefereesStatus] = useState<"saving" | "saved" | "error" | null>(null);
  const [ownGoal, setOwnGoal] = useState<{ teamId: string; minute: string; extraTime: string; eventId?: number } | null>(null);
  const [ownGoalError, setOwnGoalError] = useState("");
  const [savingOwnGoal, setSavingOwnGoal] = useState(false);
  const saveOwnGoal = async () => {
    if (!ownGoal || savesInProgress.current.ownGoal) return;
    savesInProgress.current.ownGoal = true;
    setSavingOwnGoal(true);
    setOwnGoalError("");
    try {
      const result = await saveTeamOwnGoal(match.id, { ...ownGoal, teamId: Number(ownGoal.teamId) });
      if (!result.ok) { setOwnGoalError(result.error); return; }
      setEventRows((previous) => [...previous.filter((event) => event.id !== result.event.id), result.event]);
      setOwnGoal(null);
    } catch {
      setOwnGoalError("Could not save the own goal. Please try again.");
    } finally {
      savesInProgress.current.ownGoal = false;
      setSavingOwnGoal(false);
    }
  };
  const [savedDetails, setSavedDetails] = useState({
    date: match.date || "",
    time: match.time || "",
    round: match.roundName,
    status: match.status || "",
    venue: match.venue || "",
    spectators: initialMeta?.spectators || "",
  });
  const [matchDetails, setMatchDetails] = useState(savedDetails);
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

  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlayerEventType>((initialEvents[0]?.eventType as PlayerEventType) || "goal");
  const [eventMinute, setEventMinute] = useState("");
  const [eventExtraTime, setEventExtraTime] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [assistPersonId, setAssistPersonId] = useState<string>("");
  const [goalType, setGoalType] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>("");
  const [eventRows, setEventRows] = useState(initialEvents);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventError, setEventError] = useState("");
  const [substitution, setSubstitution] = useState<{
    incoming: Appearance;
    substitutionId?: string;
    outgoingPersonId: string;
    minute: string;
    extraTime: string;
    reason: string;
  } | null>(null);
  const [savingSubstitution, setSavingSubstitution] = useState(false);
  const [substitutionError, setSubstitutionError] = useState("");
  const substitutionForm = useRef<HTMLDivElement>(null);

  const openSubstitution = (incoming: Appearance) => {
    if (savesInProgress.current.event || savesInProgress.current.substitution) return;
    const entry = eventRows.find((event) => event.personId === incoming.person.id && event.teamId === incoming.teamId && event.eventType === "sub_in" && event.substitutionId);
    const outgoing = entry && eventRows.find((event) => event.substitutionId === entry.substitutionId && event.eventType === "sub_out");
    setSelectedPlayer(null);
    setEditingEventId(null);
    setSubstitutionError("");
    setSubstitution({
      incoming,
      substitutionId: entry?.substitutionId || undefined,
      outgoingPersonId: outgoing ? String(outgoing.personId) : "",
      minute: entry?.minute || "",
      extraTime: entry?.extraTime || "",
      reason: entry?.substitutionReason || "",
    });
    requestAnimationFrame(() => substitutionForm.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const replacementOptions = useMemo(() => {
    if (!substitution || substitution.incoming.teamId === null) return [];
    const { teamId, person } = substitution.incoming;
    const time = matchTime(substitution.minute, substitution.extraTime);
    const onField = time ? playersOnField(
      appearances.map((a) => ({ personId: a.person.id, teamId: a.teamId, role: a.role })),
      eventRows,
      teamId,
      time,
      substitution.substitutionId,
    ) : null;
    const previousEntrants = new Set(onField ? [] : eventRows
      .filter((event) => event.teamId === teamId && isSubstitutionIn(event.eventType) && matchTime(event.minute || "", event.extraTime || ""))
      .map((event) => event.personId));
    return appearances
      .filter((a) => a.teamId === teamId && ["Starter", "Substitute"].includes(a.role) && a.person.id !== person.id)
      .filter((a) => onField ? onField.has(a.person.id) : a.role === "Starter" || previousEntrants.has(a.person.id))
      .sort((a, b) => displayName(a.person).localeCompare(displayName(b.person)));
  }, [substitution, appearances, eventRows]);

  const persistSubstitution = async () => {
    if (!substitution || substitution.incoming.teamId === null || savesInProgress.current.substitution) return;
    if (!replacementOptions.some((a) => String(a.person.id) === substitution.outgoingPersonId)) {
      setSubstitutionError("Choose the player being replaced at that minute.");
      return;
    }
    savesInProgress.current.substitution = true;
    setSavingSubstitution(true);
    setSubstitutionError("");
    try {
      const result = await saveMatchSubstitution(match.id, {
        substitutionId: substitution.substitutionId,
        teamId: substitution.incoming.teamId,
        incomingPersonId: substitution.incoming.person.id,
        outgoingPersonId: Number(substitution.outgoingPersonId),
        minute: substitution.minute,
        extraTime: substitution.extraTime,
        reason: substitution.reason,
      });
      if (!result.ok) { setSubstitutionError(result.error); return; }
      setEventRows((previous) => [...previous.filter((event) => !result.events.some((saved) => saved.id === event.id)), ...result.events]);
      setSubstitution(null);
    } catch {
      setSubstitutionError("Could not save the substitution. Please try again.");
    } finally {
      savesInProgress.current.substitution = false;
      setSavingSubstitution(false);
    }
  };

  const editEvent = (event: (typeof eventRows)[number]) => {
    if (savesInProgress.current.event || savesInProgress.current.substitution || savesInProgress.current.ownGoal) return;
    if (event.personId === null) {
      setOwnGoal({ eventId: event.id, teamId: String(event.teamId || ""), minute: event.minute || "", extraTime: event.extraTime || "" });
      setOwnGoalError("");
      return;
    }
    if (event.substitutionId) {
      const incomingEvent = eventRows.find((entry) => entry.substitutionId === event.substitutionId && entry.eventType === "sub_in");
      const incoming = appearances.find((a) => a.person.id === incomingEvent?.personId && a.teamId === event.teamId && a.role === "Substitute");
      if (incoming) { openSubstitution(incoming); return; }
    }
    setSubstitution(null);
    setEventError("");
    const appearance = appearances.find((a) => a.person.id === event.personId && a.teamId === event.teamId);
    setSelectedPlayer({ id: event.personId, name: event.playerName, teamName: event.teamName || "", teamId: appearance?.teamId ?? null });
    setEditingEventId(event.id);
    setSelectedEvent(event.eventType as PlayerEventType);
    setEventMinute(event.minute || "");
    setEventExtraTime(event.extraTime || "");
    setAssistPersonId(event.assistPersonId ? String(event.assistPersonId) : "");
    setGoalType(event.goalType || "");
    setBookingReason(event.bookingReason || "");
  };

  const selectEventPlayer = (appearance: Appearance) => {
    if (savesInProgress.current.event || savesInProgress.current.substitution) return;
    setSubstitution(null);
    setEventError("");
    setEditingEventId(null);
    setSelectedPlayer({ id: appearance.person.id, name: displayName(appearance.person), teamName: appearance.teamName || "", teamId: appearance.teamId });
    setSelectedEvent("goal");
    setEventMinute("");
    setEventExtraTime("");
    setAssistPersonId("");
    setGoalType("");
    setBookingReason("");
  };

  const lineups = useMemo(() => {
    const teamAAppearances = appearances.filter((a) => a.teamName === match.teamA);
    const teamBAppearances = appearances.filter((a) => a.teamName === match.teamB);
    const byShirt = (a: Appearance, b: Appearance) =>
      shirtNumberOrder(initialShirts[a.person.id]) - shirtNumberOrder(initialShirts[b.person.id]);
    const headCoach = (staff: Appearance[]) => staff.find((a) =>
      ["coach", "headcoach", "interimcoach"].includes(a.role.trim().toLowerCase().replace(/[ _-]/g, ""))
    ) || null;
    const refs = appearances.filter((a) => a.teamId === null || a.role.toLowerCase().includes("referee") || a.role.includes("Assistant") || a.role.includes("4th"));

    return {
      teamA: {
        starters: teamAAppearances.filter((a) => a.role === "Starter").sort(byShirt),
        subs: teamAAppearances.filter((a) => a.role === "Substitute").sort(byShirt),
        headCoach: headCoach(teamAAppearances),
      },
      teamB: {
        starters: teamBAppearances.filter((a) => a.role === "Starter").sort(byShirt),
        subs: teamBAppearances.filter((a) => a.role === "Substitute").sort(byShirt),
        headCoach: headCoach(teamBAppearances),
      },
      referees: {
        main: refs.find((r) => r.role === "Main Referee" || r.role === "Referee"),
        a1: refs.find((r) => r.role === "Assistant 1"),
        a2: refs.find((r) => r.role === "Assistant 2"),
        fourth: refs.find((r) => r.role === "4th Official"),
      },
    };
  }, [appearances, initialShirts, match.teamA, match.teamB]);

  const [refInputs, setRefInputs] = useState({
    main: lineups.referees.main ? displayName(lineups.referees.main.person) : "",
    a1: lineups.referees.a1 ? displayName(lineups.referees.a1.person) : "",
    a2: lineups.referees.a2 ? displayName(lineups.referees.a2.person) : "",
    fourth: lineups.referees.fourth ? displayName(lineups.referees.fourth.person) : "",
  });

  const findRefId = (name: string, assigned?: Appearance) => {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return null;
    if (assigned && displayName(assigned.person).trim().toLowerCase() === cleaned) return assigned.person.id;
    const exact = refereeOptions.find((r) => r.name.toLowerCase() === cleaned);
    if (exact) return exact.id;
    const partial = refereeOptions.filter((r) => r.name.toLowerCase().includes(cleaned));
    return partial.length === 1 ? partial[0].id : null;
  };

  const persistMatchDetails = async () => {
    if (savesInProgress.current.details) return;
    const changes: Partial<typeof matchDetails> = {};
    for (const field of Object.keys(matchDetails) as (keyof typeof matchDetails)[]) {
      if (matchDetails[field] !== savedDetails[field]) changes[field] = matchDetails[field];
    }
    savesInProgress.current.details = true;
    setDetailsStatus("saving");
    try {
      if (Object.keys(changes).length) await saveMatchDetails(match.id, changes);
      setSavedDetails(matchDetails);
      setDetailsStatus("saved");
    } catch {
      setDetailsStatus("error");
    } finally {
      savesInProgress.current.details = false;
    }
  };

  const persistScores = async () => {
    if (savesInProgress.current.scores) return;
    savesInProgress.current.scores = true;
    setSavingScores(true);
    setScoresError("");
    try {
      await saveMatchMeta(match.id, scores);
    } catch {
      setScoresError("Could not save scores. Please try again.");
    } finally {
      savesInProgress.current.scores = false;
      setSavingScores(false);
    }
  };

  const persistReferees = async () => {
    if (savesInProgress.current.referees) return;
    const mainRefId = findRefId(refInputs.main, lineups.referees.main);
    const a1RefId = findRefId(refInputs.a1, lineups.referees.a1);
    const a2RefId = findRefId(refInputs.a2, lineups.referees.a2);
    const fourthRefId = findRefId(refInputs.fourth, lineups.referees.fourth);
    const hasInvalidInput =
      (!!refInputs.main.trim() && !mainRefId) ||
      (!!refInputs.a1.trim() && !a1RefId) ||
      (!!refInputs.a2.trim() && !a2RefId) ||
      (!!refInputs.fourth.trim() && !fourthRefId);

    if (hasInvalidInput) {
      alert("One or more referee names did not match exactly. Please pick from the dropdown suggestions.");
      return;
    }

    savesInProgress.current.referees = true;
    setRefereesStatus("saving");
    try {
      await saveMatchReferees(match.id, {
        mainRefereeId: mainRefId,
        assistant1Id: a1RefId,
        assistant2Id: a2RefId,
        fourthOfficialId: fourthRefId,
      });
      setRefereesStatus("saved");
    } catch {
      setRefereesStatus("error");
    } finally {
      savesInProgress.current.referees = false;
    }
  };

  const eventIconSrc = (eventType: string) => EVENT_OPTIONS.find((e) => e.key === eventType)?.iconSrc || "";

  const supportsAssist = selectedEvent === "goal";
  const supportsGoalType = selectedEvent === "goal" || selectedEvent === "own_goal" || selectedEvent === "penalty_goal";
  const supportsBookingReason = selectedEvent === "yellow_card" || selectedEvent === "second_yellow" || selectedEvent === "red_card";

  const assistOptions = useMemo(() => {
    const goalTime = matchTime(eventMinute, eventExtraTime);
    if (!selectedPlayer || selectedPlayer.teamId === null || !goalTime) return [];
    const activePlayers = playersOnField(
      appearances.map((a) => ({ personId: a.person.id, teamId: a.teamId, role: a.role })),
      eventRows,
      selectedPlayer.teamId,
      goalTime,
    );
    return appearances
      .filter(
        (a) =>
          a.teamId !== null &&
          a.teamId === selectedPlayer.teamId &&
          (a.role === "Starter" || a.role === "Substitute") &&
          activePlayers.has(a.person.id) &&
          a.person.id !== selectedPlayer.id
      )
      .map((a) => ({
        id: a.person.id,
        label: displayName(a.person),
      }))
      .sort((a, b) => {
        const orderA = shirtNumberOrder(initialShirts[a.id]);
        const orderB = shirtNumberOrder(initialShirts[b.id]);
        return (orderA - orderB) || a.label.localeCompare(b.label);
      });
  }, [appearances, selectedPlayer, initialShirts, eventRows, eventMinute, eventExtraTime]);
  const eligibleAssistId = assistOptions.some((a) => String(a.id) === assistPersonId) ? assistPersonId : "";

  const persistEvent = async () => {
    if (!selectedPlayer || savesInProgress.current.event) return;
    const playerAppearance = appearances.find((a) => a.person.id === selectedPlayer.id && a.teamId !== null);
    const assistName = assistOptions.find((a) => String(a.id) === eligibleAssistId)?.label || null;
    savesInProgress.current.event = true;
    setSavingEvent(true);
    setEventError("");
    try {
      await saveMatchEventEntry(match.id, {
        eventId: editingEventId,
        personId: selectedPlayer.id,
        assistPersonId: supportsAssist && eligibleAssistId ? parseInt(eligibleAssistId) : null,
        teamId: playerAppearance?.teamId ?? null,
        eventType: selectedEvent,
        minute: eventMinute,
        extraTime: eventExtraTime,
        goalType: supportsGoalType ? goalType : "",
        bookingReason: supportsBookingReason ? bookingReason : "",
      });
      const nextItem = {
        id: editingEventId || Date.now(),
        personId: selectedPlayer.id,
        assistPersonId: supportsAssist && eligibleAssistId ? parseInt(eligibleAssistId) : null,
        teamId: playerAppearance?.teamId ?? null,
        eventType: selectedEvent,
        minute: eventMinute || null,
        extraTime: eventExtraTime || null,
        goalType: supportsGoalType ? goalType || null : null,
        bookingReason: supportsBookingReason ? bookingReason || null : null,
        substitutionId: null,
        substitutionReason: null,
        playerName: selectedPlayer.name,
        assistPlayerName: assistName,
        teamName: selectedPlayer.teamName,
      };
      setEventRows((prev) => editingEventId ? prev.map((x) => (x.id === editingEventId ? nextItem : x)) : [nextItem, ...prev]);
      setEventMinute("");
      setEventExtraTime("");
      setAssistPersonId("");
      setGoalType("");
      setBookingReason("");
      setEditingEventId(null);
      setSelectedPlayer(null);
    } catch {
      setEventError("Could not save the match event. Please try again.");
    } finally {
      savesInProgress.current.event = false;
      setSavingEvent(false);
    }
  };

  const sortedEventRows = useMemo(
    () => combineGoalAndAssistEvents(eventRows)
      .filter((event) => !(event.eventType === "sub_out" && event.substitutionId && eventRows.some((entry) => entry.substitutionId === event.substitutionId && entry.eventType === "sub_in")))
      .sort((a, b) => minuteValue(b.minute, b.extraTime) - minuteValue(a.minute, a.extraTime)),
    [eventRows]
  );
  const secondHalfEvents = useMemo(() => sortedEventRows.filter((e) => eventHalf(e.minute, e.extraTime) === "2nd"), [sortedEventRows]);
  const firstHalfEvents = useMemo(() => sortedEventRows.filter((e) => eventHalf(e.minute, e.extraTime) === "1st"), [sortedEventRows]);

  const renderEventPlayerText = (ev: (typeof eventRows)[number]) => {
    if (ev.substitutionId) {
      const outgoing = eventRows.find((event) => event.substitutionId === ev.substitutionId && event.eventType === "sub_out");
      return <span><span className="text-green-700">↑ {ev.playerName}</span>{outgoing && <span className="ml-2 text-red-700">↓ {outgoing.playerName}</span>}{ev.substitutionReason && <span className="ml-2 text-slate-600">({ev.substitutionReason})</span>}</span>;
    }
    if (ev.assistPlayerName && (ev.eventType === "goal" || ev.eventType === "penalty_goal" || ev.eventType === "own_goal")) {
      return (
        <>
          {ev.playerName}
          <span className="ml-2 inline-flex items-center gap-1 text-slate-600">
            <img src="/Assist.png" alt="Assist" className="h-4 w-4" />
            {ev.assistPlayerName}
          </span>
        </>
      );
    }
    return ev.playerName;
  };

  const renderShirtCell = (personId: number) => {
    const person = appearances.find((appearance) => appearance.person.id === personId)?.person;
    return (
      <MatchShirtNumberEditor
        key={personId}
        matchId={match.id}
        personId={personId}
        playerName={person ? displayName(person) : `Player ${personId}`}
        number={initialShirts[personId] || ""}
      />
    );
  };

  const renderSubstitutionArrow = (appearance: Appearance) => (
    <button
      type="button"
      onClick={() => openSubstitution(appearance)}
      disabled={savingEvent || savingSubstitution}
      aria-label={`Record substitution for ${displayName(appearance.person)}`}
      title={`Add or edit substitution for ${displayName(appearance.person)}`}
      className="inline-flex h-7 w-5 shrink-0 items-center justify-center rounded border border-green-600 bg-green-50 text-lg font-bold text-green-800 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-green-700 disabled:opacity-60"
    >↑</button>
  );

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
            <div id="match-details-heading" className="bg-[#dfdfdf] border-b border-[#c50000] text-center text-[22px] font-bold py-1">Match Info &amp; Extras</div>
            <form aria-labelledby="match-details-heading" onChange={() => setDetailsStatus(null)} onSubmit={(e) => { e.preventDefault(); void persistMatchDetails(); }}>
              <fieldset disabled={detailsStatus === "saving"} className="p-2 flex flex-col gap-1">
                {([
                  ["date", "Date"],
                  ["time", "Time"],
                  ["round", "Round"],
                ] as const).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-1">
                    <span className="w-16 font-bold">{label}</span>
                    <input value={matchDetails[field]} onChange={(e) => setMatchDetails((p) => ({ ...p, [field]: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 min-w-0 h-6" />
                  </label>
                ))}
                <label className="flex items-center gap-1">
                  <span className="w-16 font-bold">Status</span>
                  <select
                    value={matchDetails.status}
                    onChange={(e) => setMatchDetails((p) => ({ ...p, status: e.target.value }))}
                    className="border border-gray-400 px-1 py-0.5 flex-1 h-6 bg-white"
                  >
                    <option value="Played">Played</option>
                    <option value="Playing">Playing</option>
                    <option value="Fixture">Fixture</option>
                    <option value="Awarded">Awarded</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Voided">Voided</option>
                    <option value="Postponed">Postponed</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Break">Break</option>
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  <span className="w-16 font-bold">Venue</span>
                  <input list="venue-list" value={matchDetails.venue} onChange={(e) => setMatchDetails((p) => ({ ...p, venue: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 min-w-0 h-6" />
                </label>
                <label className="flex items-center gap-1">
                  <span className="w-16 font-bold">Spectators</span>
                  <input value={matchDetails.spectators} onChange={(e) => setMatchDetails((p) => ({ ...p, spectators: e.target.value }))} className="border border-gray-400 px-1 py-0.5 flex-1 min-w-0 h-6" />
                </label>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <span role="status" className="text-xs">
                    {detailsStatus === "saved" ? "Saved" : detailsStatus === "error" ? "Could not save match details. Please try again." : ""}
                  </span>
                  <button type="submit" className="h-6 shrink-0 px-3 border border-gray-500 bg-[#efefef] text-[11px] font-bold disabled:cursor-wait disabled:opacity-60">
                    {detailsStatus === "saving" ? "Saving..." : "Save Match Details"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="bg-[#dfdfdf] border-b border-[#c50000] text-center text-[22px] font-bold py-1">Scores</div>
            <form className="p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); void persistScores(); }}>
              {(["FT", "HT", "ET", "PK"] as const).map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="w-10 font-bold">{k}</span>
                  <input value={scores[`${k.toLowerCase()}A` as keyof typeof scores]} onChange={(e) => setScores((p) => ({ ...p, [`${k.toLowerCase()}A`]: e.target.value }))} className="border border-gray-400 px-1 h-6 w-12 text-center" placeholder="A" />
                  <input value={scores[`${k.toLowerCase()}B` as keyof typeof scores]} onChange={(e) => setScores((p) => ({ ...p, [`${k.toLowerCase()}B`]: e.target.value }))} className="border border-gray-400 px-1 h-6 w-12 text-center" placeholder="B" />
                </div>
              ))}
              {scoresError && <p role="alert" className="text-red-700">{scoresError}</p>}
              <button type="submit" disabled={savingScores} className="self-end h-6 px-3 border border-gray-500 bg-[#efefef] text-[11px] font-bold disabled:cursor-wait disabled:opacity-60">
                {savingScores ? "Saving..." : "Save"}
              </button>
            </form>
          </div>

          <MatchNoteForm key={match.id} matchId={match.id} initialNote={initialNote} />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="border border-[#c50000] bg-[#1f2937] h-[60px] flex rounded-md overflow-hidden text-white shadow">
            <div className="flex-1 flex items-center justify-center gap-2 font-bold text-[24px] px-2">{match.teamALogo ? <img src={match.teamALogo} alt={match.teamA} className="w-9 h-9 object-contain" /> : null}<span>{match.teamA}</span></div>
            <div className="w-[80px] bg-[#374151] flex items-center justify-center font-bold text-[20px]">vs</div>
            <div className="flex-1 flex items-center justify-center gap-2 font-bold text-[24px] px-2"><span>{match.teamB}</span>{match.teamBLogo ? <img src={match.teamBLogo} alt={match.teamB} className="w-9 h-9 object-contain" /> : null}</div>
          </div>

          {substitution ? (
            <div ref={substitutionForm} className="rounded-md border border-[#c50000] bg-white shadow-sm">
              <h2 className="rounded-t-md border-b border-[#c50000] bg-green-50 px-3 py-2 text-lg font-bold">
                {substitution.substitutionId ? "Edit Substitution" : "Add Substitution"} — {substitution.incoming.teamName}
              </h2>
              <form className="flex flex-wrap items-end gap-3 p-3" onSubmit={(event) => { event.preventDefault(); void persistSubstitution(); }}>
                <div className="w-full font-bold text-green-800">↑ Player on: {displayName(substitution.incoming.person)}</div>
                <label className="flex min-w-52 flex-1 flex-col gap-1 font-bold">
                  Player off
                  <select autoFocus required value={replacementOptions.some((a) => String(a.person.id) === substitution.outgoingPersonId) ? substitution.outgoingPersonId : ""} onChange={(event) => setSubstitution({ ...substitution, outgoingPersonId: event.target.value })} className="h-8 border border-gray-400 bg-white px-2 font-normal">
                    <option value="">Choose player being replaced</option>
                    {replacementOptions.map((appearance) => <option key={appearance.id} value={appearance.person.id}>{initialShirts[appearance.person.id] ? `${initialShirts[appearance.person.id]} ` : ""}{displayName(appearance.person)}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 font-bold">
                  Minute
                  <input required inputMode="numeric" placeholder="65 or 90+3" value={substitution.minute} onChange={(event) => setSubstitution({ ...substitution, minute: event.target.value })} className="h-8 w-28 border border-gray-400 px-2 font-normal" />
                </label>
                <label className="flex flex-col gap-1 font-bold">
                  Added time
                  <input inputMode="numeric" placeholder="0" maxLength={3} value={substitution.extraTime} onChange={(event) => setSubstitution({ ...substitution, extraTime: event.target.value })} className="h-8 w-20 border border-gray-400 px-2 font-normal" />
                </label>
                <label className="flex min-w-44 flex-1 flex-col gap-1 font-bold">
                  Reason (optional)
                  <select value={substitution.reason} onChange={(event) => setSubstitution({ ...substitution, reason: event.target.value })} className="h-8 border border-gray-400 bg-white px-2 font-normal">
                    <option value="">No reason</option>
                    {substitution.reason && !SUBSTITUTION_REASONS.includes(substitution.reason) && <option value={substitution.reason} hidden disabled>{substitution.reason}</option>}
                    {SUBSTITUTION_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
                <button type="submit" disabled={savingSubstitution} className="h-8 rounded bg-green-700 px-3 font-bold text-white disabled:opacity-60">{savingSubstitution ? "Saving..." : "Save Substitution"}</button>
                <button type="button" disabled={savingSubstitution} onClick={() => setSubstitution(null)} className="h-8 rounded border border-gray-400 px-3 disabled:opacity-60">Cancel</button>
                {substitutionError && <p role="alert" className="w-full text-red-700">{substitutionError}</p>}
              </form>
            </div>
          ) : null}

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
                  <button type="submit" disabled={savingEvent} className="h-6 px-3 border border-gray-500 bg-[#efefef] font-bold text-[12px] disabled:opacity-60">{savingEvent ? "Saving..." : "Save"}</button>
                </div>
                {(supportsAssist || supportsGoalType || supportsBookingReason) ? (
                  <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
                    {supportsAssist ? (
                      <>
                        <img src="/Assist.png" alt="Assist" className="w-5 h-5 object-contain" />
                        <select value={eligibleAssistId} onChange={(e) => setAssistPersonId(e.target.value)} disabled={!matchTime(eventMinute, eventExtraTime)} className="h-6 border border-gray-400 px-1 min-w-[180px]">
                          <option value="">{matchTime(eventMinute, eventExtraTime) ? "" : "Enter goal minute first"}</option>
                          {assistOptions.map((a) => (
                            <option key={a.id} value={a.id}>{initialShirts[a.id] ? `${initialShirts[a.id]}. ` : ""}{a.label}</option>
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
              {eventError && <p role="alert" className="px-2 pb-2 text-red-700">{eventError}</p>}
            </div>
          ) : null}

          <div className="border border-[#c50000] bg-white rounded-md overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f3f4f6] border-b border-[#c50000] px-3 py-1">
              <h2 className="text-[20px] font-bold">Match Events</h2>
              <button type="button" disabled={savingOwnGoal} onClick={() => { setOwnGoal({ teamId: "", minute: "", extraTime: "" }); setOwnGoalError(""); }} className="rounded border border-[#040f4f] bg-[#f4a01c] px-3 py-1 text-xs font-bold text-[#040f4f]">Add Team Own Goal</button>
            </div>
            {ownGoal && (
              <form onSubmit={(event) => { event.preventDefault(); void saveOwnGoal(); }} className="m-3 space-y-3 rounded border border-gray-300 bg-orange-50 p-3 text-sm">
                <h3 className="font-bold">{ownGoal.eventId ? "Edit" : "Add"} Team Own Goal</h3>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">Team committing the own goal
                    <select required disabled={savingOwnGoal} value={ownGoal.teamId} onChange={(event) => setOwnGoal({ ...ownGoal, teamId: event.target.value })} className="border border-gray-400 bg-white p-1">
                      <option value="">Choose team</option>
                      {match.teamAId && <option value={match.teamAId}>{match.teamA}</option>}
                      {match.teamBId && <option value={match.teamBId}>{match.teamB}</option>}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">Minute
                    <input required disabled={savingOwnGoal} value={ownGoal.minute} onChange={(event) => setOwnGoal({ ...ownGoal, minute: event.target.value })} placeholder="52 or 90+3" className="w-28 border border-gray-400 bg-white p-1" />
                  </label>
                  <label className="flex flex-col gap-1">Added time
                    <input disabled={savingOwnGoal} value={ownGoal.extraTime} onChange={(event) => setOwnGoal({ ...ownGoal, extraTime: event.target.value })} placeholder="Optional" inputMode="numeric" className="w-24 border border-gray-400 bg-white p-1" />
                  </label>
                  <button type="submit" disabled={savingOwnGoal} className="rounded bg-[#f4a01c] px-3 py-1 font-bold disabled:opacity-50">{savingOwnGoal ? "Saving..." : "Save Own Goal"}</button>
                  <button type="button" disabled={savingOwnGoal} onClick={() => setOwnGoal(null)} className="px-2 py-1 underline">Cancel</button>
                </div>
                {ownGoal.teamId && <p className="text-xs">Own goal committed by {Number(ownGoal.teamId) === match.teamAId ? match.teamA : match.teamB}, benefiting {Number(ownGoal.teamId) === match.teamAId ? match.teamB : match.teamA}. No player is attributed.</p>}
                {ownGoalError && <p role="alert" className="text-red-700">{ownGoalError}</p>}
              </form>
            )}
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
                          onClick={() => editEvent(ev)}
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
                          onClick={() => editEvent(ev)}
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
            <div className="grid grid-cols-2 gap-6 border-b border-gray-200 px-4 py-3 text-sm">
              {[
                { team: match.teamA, coach: lineups.teamA.headCoach, alignment: "text-right" },
                { team: match.teamB, coach: lineups.teamB.headCoach, alignment: "text-left" },
              ].map(({ team, coach, alignment }) => (
                <div key={team} className={alignment} aria-label={`Head coach for ${team}`}>
                  <div className="font-bold">Head coach</div>
                  {coach ? (
                    <a href={`/admin/people/${coach.person.id}`} className="text-blue-700 hover:underline">{displayName(coach.person)}</a>
                  ) : <span className="text-gray-500">Not assigned</span>}
                </div>
              ))}
            </div>
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
                  <div key={`starter-${i}`} className="grid grid-cols-[250px_30px_28px_56px_18px_56px_28px_30px_250px] items-center leading-6">
                    <span className="text-right">
                      {left ? <button type="button" disabled={savingSubstitution} onClick={() => selectEventPlayer(left)} className="hover:underline">{leftName}</button> : "\u00A0"}
                    </span>
                    <span className="text-center font-bold">{leftPos || "\u00A0"}</span>
                    <span className="text-center">{leftFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{left ? renderShirtCell(left.person.id) : "\u00A0"}</span>
                    <span className="text-left">&nbsp;</span>
                    <span className="text-center font-bold">{right ? renderShirtCell(right.person.id) : "\u00A0"}</span>
                    <span className="text-center">{rightFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{rightPos || "\u00A0"}</span>
                    <span className="text-left">
                      {right ? <button type="button" disabled={savingSubstitution} onClick={() => selectEventPlayer(right)} className="hover:underline">{rightName}</button> : "\u00A0"}
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
                  <div key={`sub-${i}`} className="grid grid-cols-[250px_30px_28px_56px_18px_56px_28px_30px_250px] items-center leading-6 bg-gray-50">
                    <span className="text-right">
                      {left ? <button type="button" disabled={savingSubstitution} onClick={() => selectEventPlayer(left)} className="hover:underline">{leftName}</button> : "\u00A0"}
                    </span>
                    <span className="text-center font-bold">{leftPos || "\u00A0"}</span>
                    <span className="text-center">{leftFlag || "\u00A0"}</span>
                    <span className="inline-flex items-center gap-1">{left ? <><span className="w-8 shrink-0">{renderShirtCell(left.person.id)}</span>{renderSubstitutionArrow(left)}</> : "\u00A0"}</span>
                    <span className="text-left">&nbsp;</span>
                    <span className="inline-flex items-center gap-1">{right ? <><span className="w-8 shrink-0">{renderShirtCell(right.person.id)}</span>{renderSubstitutionArrow(right)}</> : "\u00A0"}</span>
                    <span className="text-center">{rightFlag || "\u00A0"}</span>
                    <span className="text-center font-bold">{rightPos || "\u00A0"}</span>
                    <span className="text-left">
                      {right ? <button type="button" disabled={savingSubstitution} onClick={() => selectEventPlayer(right)} className="hover:underline">{rightName}</button> : "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#c50000] px-4 py-3">
              <div id="referees-heading" className="font-bold text-[20px] mb-2">Referees</div>
              <form aria-labelledby="referees-heading" onChange={() => setRefereesStatus(null)} onSubmit={(e) => { e.preventDefault(); void persistReferees(); }}>
                <fieldset disabled={refereesStatus === "saving"} className="grid grid-cols-1 gap-2 text-[14px] sm:grid-cols-2">
                  {([
                    ["main", "R", "Main referee"],
                    ["a1", "A1", "Assistant referee 1"],
                    ["a2", "A2", "Assistant referee 2"],
                    ["fourth", "4th", "Fourth official"],
                  ] as const).map(([field, label, name]) => (
                    <label key={field} className="flex items-center gap-1">
                      <b className="w-8">{label}:</b>
                      <input list="referee-list" aria-label={name} value={refInputs[field]} onChange={(e) => setRefInputs((p) => ({ ...p, [field]: e.target.value }))} className="border border-gray-400 h-6 px-1 flex-1 min-w-0" />
                    </label>
                  ))}
                  <div className="mt-1 flex items-center justify-end gap-2 sm:col-span-2">
                    <span role="status" className="text-xs">
                      {refereesStatus === "saved" ? "Saved" : refereesStatus === "error" ? "Could not save referees. Please try again." : ""}
                    </span>
                    <button type="submit" className="h-6 shrink-0 px-3 border border-gray-500 bg-[#efefef] text-[11px] font-bold disabled:cursor-wait disabled:opacity-60">
                      {refereesStatus === "saving" ? "Saving..." : "Save Referees"}
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
