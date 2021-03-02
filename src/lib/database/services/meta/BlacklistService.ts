import { GameBlacklist } from "../../../../structures/game/blacklist/Blacklist";
import { GameProfile } from "../../../../structures/game/Profile";
import { BlacklistGet } from "../../sql/meta/blacklist/BlacklistGet";
import { BlacklistSet } from "../../sql/meta/blacklist/BlacklistSet";

export abstract class BlacklistService {
  public static async getBlacklistById(id: number): Promise<GameBlacklist> {
    return await BlacklistGet.getBlacklistById(id);
  }

  public static async blacklist(
    profile: GameProfile,
    moderator: GameProfile,
    reason: string
  ): Promise<GameBlacklist> {
    return await BlacklistSet.blacklist(profile, moderator, reason);
  }

  public static async quashBlacklist(
    blacklist: GameBlacklist,
    quasher: GameProfile,
    note: string
  ): Promise<GameBlacklist> {
    return await BlacklistSet.quashBlacklist(blacklist, quasher, note);
  }

  public static async findBlacklist(
    profile: GameProfile
  ): Promise<GameBlacklist | undefined> {
    return await BlacklistGet.findBlacklist(profile);
  }
}
