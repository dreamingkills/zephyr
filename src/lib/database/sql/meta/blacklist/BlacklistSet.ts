import { DB, DBClass } from "../../..";
import { GameBlacklist } from "../../../../../structures/game/blacklist/Blacklist";
import { GameProfile } from "../../../../../structures/game/Profile";
import { BlacklistService } from "../../../services/meta/BlacklistService";

export abstract class BlacklistSet extends DBClass {
  public static async blacklist(
    profile: GameProfile,
    moderator: GameProfile,
    reason: string
  ): Promise<GameBlacklist> {
    const query = (await DB.query(
      `INSERT INTO blacklist (discord_id, reason, moderator_id) VALUES (?, ?, ?);`,
      [profile.discordId, reason, moderator.discordId]
    )) as { insertId: number };

    return await BlacklistService.getBlacklistById(query.insertId);
  }

  public static async quashBlacklist(
    blacklist: GameBlacklist,
    quasher: GameProfile,
    note: string
  ): Promise<GameBlacklist> {
    await DB.query(
      `UPDATE blacklist SET active=0, quashed_by=?, quash_note=? WHERE id=?;`,
      [quasher.discordId, note, blacklist.id]
    );

    return await blacklist.fetch();
  }
}
