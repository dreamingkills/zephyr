import { GameProfile } from "../../../../structures/game/Profile";
import { GamePatron } from "../../../../structures/meta/Patron";
import { PatreonGet } from "../../sql/meta/patreon/PatreonGet";
import { PatreonSet } from "../../sql/meta/patreon/PatreonSet";

export abstract class PatreonService {
  public static async getPatronInformation(
    profile: GameProfile
  ): Promise<GamePatron> {
    return await PatreonGet.getPatronInformation(profile);
  }

  public static async addPatron(profile: GameProfile): Promise<void> {
    return await PatreonSet.addPatron(profile);
  }

  public static async removePatron(profile: GameProfile): Promise<void> {
    return await PatreonSet.removePatron(profile);
  }

  public static async setNextPatreonClaimTime(
    profile: GameProfile
  ): Promise<void> {
    return await PatreonSet.setNextPatreonClaimTime(profile);
  }
}
