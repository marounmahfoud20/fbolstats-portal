type LineupPlayer = {
  membershipStartDate: string;
  membershipEndDate: string | null;
  shirtNumber: number;
};

export function getEligiblePlayers(players: LineupPlayer[], matchDate: string) {
  const matchDateObj = new Date(matchDate);

  return players
    .filter((player) => {
      const start = new Date(player.membershipStartDate);
      const end = player.membershipEndDate ? new Date(player.membershipEndDate) : new Date("9999-12-31");
      return matchDateObj >= start && matchDateObj <= end;
    })
    .sort((a, b) => a.shirtNumber - b.shirtNumber);
}
