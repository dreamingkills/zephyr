import { GameBaseCard } from "../structures/game/BaseCard";
import { GameProfile } from "../structures/game/Profile";
import * as ZephyrError from "../structures/error/ZephyrError";
import { ProfileService } from "./database/services/game/ProfileService";
import { DB } from "./database";

export abstract class IssueHandler {
  public static queueIssueGeneration = (() => {
    let pending = Promise.resolve();
    const run = async (
      card: GameBaseCard,
      profile: GameProfile,
      price: number
    ): Promise<any> => {
      try {
        await pending;
      } finally {
        if (profile.bits < price)
          throw new ZephyrError.NotEnoughBitsError(profile.bits, price);

        if (price > 0)
          await ProfileService.removeBitsFromProfile(profile, price);

        await DB.query(`UPDATE card_base SET serial_total=? WHERE id=?;`, [
          card.serialTotal + 1,
          card.id,
        ]);
        return card.serialTotal + 1;
      }
    };
    return (card: GameBaseCard, profile: GameProfile, price: number) =>
      (pending = run(card, profile, price));
  })();
}
