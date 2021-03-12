import { DB, DBClass } from "../../..";
import { GameBadge, GameUserBadge } from "../../../../../structures/game/Badge";
import { GameProfile } from "../../../../../structures/game/Profile";
import { BadgeService } from "../../../services/game/BadgeService";

export abstract class BadgeSet extends DBClass {
  public static async createBadge(
    name: string,
    emoji: string
  ): Promise<GameBadge> {
    const query = (await DB.query(
      `INSERT INTO badge (badge_name, badge_emoji) VALUES (?, ?);`,
      [name, emoji]
    )) as { insertId: number };

    return await BadgeService.getBadgeById(query.insertId);
  }

  public static async deleteBadge(badge: GameBadge): Promise<void> {
    await DB.query(
      `DELETE badge.*, user_badge.* FROM 
         badge
       LEFT JOIN
         user_badge
       ON
         user_badge.badge_id=badge.id
       WHERE badge.id=? OR user_badge.badge_id=?;`,
      [badge.id, badge.id]
    );

    return;
  }

  public static async createUserBadge(
    profile: GameProfile,
    badge: GameBadge
  ): Promise<GameUserBadge> {
    const query = (await DB.query(
      `INSERT INTO user_badge (discord_id, badge_id) VALUES (?, ?);`,
      [profile.discordId, badge.id]
    )) as { insertId: number };

    return await BadgeService.getUserBadgeById(query.insertId);
  }

  public static async deleteUserBadge(
    profile: GameProfile,
    badge: GameUserBadge
  ): Promise<void> {
    await DB.query(`DELETE FROM user_badge WHERE id=? AND discord_id=?;`, [
      badge.id,
      profile.discordId,
    ]);

    return;
  }
}

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
