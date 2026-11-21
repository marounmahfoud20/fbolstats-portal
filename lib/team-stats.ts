import prisma from '@/lib/prisma';

export type TeamStatKind = 'appearances' | 'goals' | 'assists';

export type TeamStatRow = {
  personId: number;
  name: string;
  total: number;
};

export const TEAM_STAT_LABELS: Record<TeamStatKind, string> = {
  appearances: 'Top appearances',
  goals: 'Top goalscorer',
  assists: 'Top assists',
};

export async function getTeamStats(teamId: number, kind: TeamStatKind): Promise<TeamStatRow[]> {
  if (kind === 'appearances') {
    return prisma.$queryRaw<TeamStatRow[]>`
      SELECT p."id" AS "personId",
        COALESCE(NULLIF(p."commonName", ''), NULLIF(CONCAT_WS(' ', p."firstName", p."lastName"), ''), 'Unknown') AS "name",
        COUNT(DISTINCT ma."matchId")::int AS "total"
      FROM "MatchAppearance" ma
      INNER JOIN "Person" p ON p."id" = ma."personId"
      WHERE ma."teamId" = ${teamId}
        AND LOWER(TRIM(ma."role")) IN ('player', 'starter', 'substitute', 'captain', 'goalkeeper')
      GROUP BY p."id", p."commonName", p."firstName", p."lastName"
      ORDER BY "total" DESC, "name" ASC
    `;
  }

  if (kind === 'goals') {
    return prisma.$queryRaw<TeamStatRow[]>`
      SELECT p."id" AS "personId",
        COALESCE(NULLIF(p."commonName", ''), NULLIF(CONCAT_WS(' ', p."firstName", p."lastName"), ''), 'Unknown') AS "name",
        COUNT(*)::int AS "total"
      FROM "MatchEvent" e
      INNER JOIN "Person" p ON p."id" = e."personId"
      WHERE e."teamId" = ${teamId} AND e."eventType" IN ('goal', 'penalty_goal')
        AND (
          EXISTS (
            SELECT 1 FROM "Membership" m
            WHERE m."personId" = e."personId" AND m."teamId" = e."teamId"
              AND LOWER(TRIM(m."role")) = 'player'
          )
          OR EXISTS (
            SELECT 1 FROM "MatchAppearance" ma
            WHERE ma."personId" = e."personId" AND ma."teamId" = e."teamId" AND ma."matchId" = e."matchId"
              AND LOWER(TRIM(ma."role")) IN ('player', 'starter', 'substitute', 'captain', 'goalkeeper')
          )
        )
      GROUP BY p."id", p."commonName", p."firstName", p."lastName"
      ORDER BY "total" DESC, "name" ASC
    `;
  }

  return prisma.$queryRaw<TeamStatRow[]>`
    WITH team_events AS (
      SELECT e.*,
        SPLIT_PART(REGEXP_REPLACE(COALESCE(e."minute", ''), '[^0-9+]', '', 'g'), '+', 1) AS "clockMinute",
        COALESCE(NULLIF(TRIM(e."extraTime"), ''),
          NULLIF(SPLIT_PART(REGEXP_REPLACE(COALESCE(e."minute", ''), '[^0-9+]', '', 'g'), '+', 2), ''), '0') AS "clockExtra"
      FROM "MatchEvent" e
      WHERE e."teamId" = ${teamId} AND e."eventType" IN ('goal', 'penalty_goal', 'assist')
    ), assist_credits AS (
      SELECT g."matchId", g."teamId", g."assistPersonId" AS "personId"
      FROM team_events g
      WHERE g."eventType" IN ('goal', 'penalty_goal') AND g."assistPersonId" IS NOT NULL
      UNION ALL
      SELECT a."matchId", a."teamId", a."personId"
      FROM team_events a
      WHERE a."eventType" = 'assist' AND NOT EXISTS (
        SELECT 1 FROM team_events g
        WHERE g."eventType" IN ('goal', 'penalty_goal')
          AND g."matchId" = a."matchId" AND g."assistPersonId" = a."personId"
          AND g."clockMinute" <> '' AND g."clockMinute" = a."clockMinute"
          AND g."clockExtra" = a."clockExtra"
      )
    )
    SELECT p."id" AS "personId",
      COALESCE(NULLIF(p."commonName", ''), NULLIF(CONCAT_WS(' ', p."firstName", p."lastName"), ''), 'Unknown') AS "name",
      COUNT(*)::int AS "total"
    FROM assist_credits e
    INNER JOIN "Person" p ON p."id" = e."personId"
    WHERE e."teamId" = ${teamId}
      AND (
        EXISTS (
          SELECT 1 FROM "Membership" m
          WHERE m."personId" = e."personId" AND m."teamId" = e."teamId"
            AND LOWER(TRIM(m."role")) = 'player'
        )
        OR EXISTS (
          SELECT 1 FROM "MatchAppearance" ma
          WHERE ma."personId" = e."personId" AND ma."teamId" = e."teamId" AND ma."matchId" = e."matchId"
            AND LOWER(TRIM(ma."role")) IN ('player', 'starter', 'substitute', 'captain', 'goalkeeper')
        )
      )
    GROUP BY p."id", p."commonName", p."firstName", p."lastName"
    ORDER BY "total" DESC, "name" ASC
  `;
}
