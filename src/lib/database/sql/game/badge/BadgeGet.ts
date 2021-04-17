import { DB } from "../../..";
import {
  Badge,
  GameBadge,
  GameUserBadge,
  UserBadge,
} from "../../../../../structures/game/Badge";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function getBadgeById(id: number): Promise<GameBadge> {
  const query = (await DB.query(`SELECT * FROM badge WHERE id=?;`, [
    id,
  ])) as Badge[];

  if (!query[0]) throw new ZephyrError.BadgeNotFoundError(id);

  return new GameBadge(query[0]);
}

export async function getUserBadgeById(id: number): Promise<GameUserBadge> {
  const query = (await DB.query(`SELECT * FROM user_badge WHERE id=?;`, [
    id,
  ])) as UserBadge[];

  if (!query[0]) throw new ZephyrError.UserBadgeNotFoundError(id);

  return new GameUserBadge(query[0]);
}

export async function getProfileBadges(
  profile: GameProfile
): Promise<GameUserBadge[]> {
  const query = (await DB.query(
    `SELECT 
        user_badge.id,
        user_badge.discord_id,
        user_badge.badge_id,
        user_badge.created_at,
        badge.badge_name,
        badge.badge_emoji,
        badge.badge_description
      FROM
        user_badge
      LEFT JOIN
        badge
      ON 
        badge.id=user_badge.badge_id
      WHERE
        discord_id=?;`,
    [profile.discordId]
  )) as UserBadge[];

  return query.map((b) => new GameUserBadge(b));
}

export async function getBadgeByName(
  name: string
): Promise<GameBadge | undefined> {
  const query = (await DB.query(
    `SELECT * FROM badge WHERE badge_name LIKE ?;`,
    [name]
  )) as Badge[];

  if (!query[0]) return;

  return new GameBadge(query[0]);
}

export async function getBadgeByEmoji(
  emoji: string
): Promise<GameBadge | undefined> {
  const query = (await DB.query(`SELECT * FROM badge WHERE badge_emoji=?;`, [
    emoji,
  ])) as Badge[];

  if (!query[0]) return;

  return new GameBadge(query[0]);
}

export async function getNumberOfBadgeGranted(
  badge: GameBadge
): Promise<number> {
  const query = (await DB.query(
    `SELECT
         COUNT(*) AS count
       FROM
         user_badge
       LEFT JOIN
         profile
       ON
         user_badge.discord_id=profile.discord_id
       WHERE
         user_badge.badge_id=?
         AND profile.blacklisted=0;`,
    [badge.id]
  )) as { count: number }[];

  return query[0].count;
}

export * as BadgeGet from "./BadgeGet";

/*
CREATE TABLE badge
(
    id              INT(11) AUTO_INCREMENT,
    badge_name      TEXT(32) NOT NULL,
    badge_emoji     TEXT(8) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE user_badge
(
    id              INT(11) AUTO_INCREMENT,
    discord_id      VARCHAR(32) NOT NULL,
    badge_id        INT(11) NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT UniqueUserBadge UNIQUE (discord_id, badge_id)
);
*/
