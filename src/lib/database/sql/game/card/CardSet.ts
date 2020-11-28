import { Chance } from "chance";
import { DB, DBClass } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameBaseCard } from "../../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { IssueHandler } from "../../../../IssueHandler";
import { CardService } from "../../../services/game/CardService";
export abstract class CardSet extends DBClass {
  public static async createNewUserCard(
    card: GameBaseCard,
    profile: GameProfile,
    zephyr: Zephyr,
    price: number,
    tier?: number
  ): Promise<GameUserCard> {
    const chance = new Chance();
    if (!tier)
      tier = chance.weighted(
        [1, 2, 3, 4, 5, 6].slice(0, card.maxTier),
        [1000, 80, 20, 7, 1.5, 0.1].slice(0, card.maxTier)
      );
    let issue = await IssueHandler.queueIssueGeneration(card, profile, price);
    let tries = 0;
    while (true) {
      try {
        const query = (await DB.query(
          `INSERT INTO user_card (card_id, serial_number, discord_id, original_owner, tier) VALUES (?, ?, ?, ?, ?)`,
          [card.id, issue, profile.discordId, profile.discordId, tier]
        )) as { insertId: number };
        zephyr.cards[card.id].serialTotal = issue;
        return await CardService.getUserCardById(query.insertId);
      } catch (e) {
        if (++tries === 3) throw e;
        issue++;
      }
    }
  }
  public static async setCardFrame(
    card: GameUserCard,
    frameId: number
  ): Promise<GameUserCard> {
    await DB.query(`UPDATE user_card SET frame=? WHERE id=?;`, [
      frameId,
      card.id,
    ]);
    return await CardService.getUserCardById(card.id);
  }
}
