import { GameProfile } from "../../../../structures/game/Profile";
import { GamePatron } from "../../../../structures/meta/Patron";
import { PatronGet } from "../../sql/meta/patreon/PatreonGet";
import { PatronSet } from "../../sql/meta/patreon/PatronSet";

export abstract class PatreonService {
  public static async getPatronInformation(
    profile: GameProfile
  ): Promise<GamePatron> {
    return await PatronGet.getPatronInformation(profile);
  }

  public static async addPatron(profile: GameProfile): Promise<void> {
    return await PatronSet.addPatron(profile);
  }

  public static async removePatron(profile: GameProfile): Promise<void> {
    return await PatronSet.removePatron(profile);
  }

  public static async setNextPatreonClaimTime(
    profile: GameProfile
  ): Promise<void> {
    return await PatronSet.setNextPatreonClaimTime(profile);
  }
}
