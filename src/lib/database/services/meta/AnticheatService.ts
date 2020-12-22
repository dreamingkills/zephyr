import { GameItem } from "../../../../structures/game/Item";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { ACSet } from "../../sql/meta/anticheat/ACSet";

export abstract class AnticheatService {
  public static async logGift(
    giver: GameProfile,
    recipient: GameProfile,
    cards: GameUserCard[]
  ): Promise<void> {
    return await ACSet.logGift(giver, recipient, cards);
  }

  public static async logClaim(
    claimer: GameProfile,
    dropper: GameProfile | undefined,
    card: GameUserCard,
    claimTime: number,
    dropTime: number
  ): Promise<void> {
    return await ACSet.logClaim(claimer, dropper, card, claimTime, dropTime);
  }

  public static async logBitTransaction(
    giver: GameProfile,
    recipient: GameProfile,
    amount: number
  ): Promise<void> {
    return await ACSet.logBitTransaction(giver, recipient, amount);
  }

  public static async logItemTransaction(
    giver: GameProfile,
    recipient: GameProfile,
    items: GameItem[]
  ): Promise<void> {
    return await ACSet.logItemTransaction(giver, recipient, items);
  }
}
