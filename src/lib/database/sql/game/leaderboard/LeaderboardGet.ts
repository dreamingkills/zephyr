import { DB } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameProfile, Profile } from "../../../../../structures/game/Profile";

export async function getBitLeaderboardCount(): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) as count FROM profile WHERE bits>0 AND blacklisted=0;`
  )) as { count: number }[];
  return query[0].count;
}

export async function getBitLeaderboard(page: number): Promise<GameProfile[]> {
  const offset = page * 10 - 10;
  const query = (await DB.query(
    `SELECT * FROM profile WHERE bits>0 AND blacklisted=0 ORDER BY bits DESC LIMIT ? OFFSET ?`,
    [10, offset]
  )) as Profile[];
  return query.map((p) => new GameProfile(p));
}

export async function getDailyStreakLeaderboardCount(): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) as count FROM profile WHERE daily_streak>0 AND blacklisted=0;`
  )) as { count: number }[];
  return query[0].count;
}

export async function getDailyStreakLeaderboard(
  page: number
): Promise<GameProfile[]> {
  const offset = page * 10 - 10;
  const query = (await DB.query(
    `SELECT * FROM profile WHERE daily_streak>0 AND blacklisted=0 ORDER BY daily_streak DESC LIMIT ? OFFSET ?`,
    [10, offset]
  )) as Profile[];
  return query.map((p) => new GameProfile(p));
}

export async function getCardLeaderboardCount(): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM (SELECT profile.*, COUNT(*) AS count FROM profile LEFT JOIN user_card ON user_card.discord_id=profile.discord_id WHERE blacklisted=0 AND user_card.discord_id!=? GROUP BY profile.discord_id) q;`,
    [Zephyr.user.id]
  )) as { count: number }[];
  return query[0].count;
}

export async function getCardLeaderboard(
  page: number
): Promise<{ profile: GameProfile; count: number }[]> {
  const offset = page * 10 - 10;
  const query = (await DB.query(
    `SELECT profile.*, COUNT(*) as count FROM profile LEFT JOIN user_card ON user_card.discord_id=profile.discord_id WHERE blacklisted=0 AND user_card.discord_id!=? GROUP BY profile.discord_id ORDER BY count DESC, user_card.discord_id LIMIT ? OFFSET ?;`,
    [Zephyr.user.id, 10, offset]
  )) as (Profile & { count: number })[];
  return query.map((p) => {
    return { profile: new GameProfile(p), count: p.count };
  });
}

export async function getCubitLeaderboardCount(): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) as count FROM profile WHERE cubits>0 AND blacklisted=0;`
  )) as { count: number }[];
  return query[0].count;
}

export async function getCubitLeaderboard(
  page: number
): Promise<GameProfile[]> {
  const offset = page * 10 - 10;
  const query = (await DB.query(
    `SELECT * FROM profile WHERE cubits>0 AND blacklisted=0 ORDER BY cubits DESC LIMIT ? OFFSET ?`,
    [10, offset]
  )) as Profile[];
  return query.map((p) => new GameProfile(p));
}

export * as LeaderboardGet from "./LeaderboardGet";
