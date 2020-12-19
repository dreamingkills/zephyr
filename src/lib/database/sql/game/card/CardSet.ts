import { DB, DBClass } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameBaseCard } from "../../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { IssueHandler } from "../../../../IssueHandler";
import { CardService } from "../../../services/game/CardService";
import { Chance } from "chance";
import { GameDye } from "../../../../../structures/game/Dye";
export abstract class CardSet extends DBClass {
  public static async createNewUserCard(
    card: GameBaseCard,
    profile: GameProfile,
    zephyr: Zephyr,
    price: number,
    claimTime: number,
    frame?: number
  ): Promise<GameUserCard> {
    const rng = new Chance();
    const wear = rng.weighted([0, 1, 2, 3, 4, 5], [15, 45, 35, 15, 7, 2]);
    const luckCoefficient = rng.floating({ min: 0, max: 1, fixed: 10 });
    let issue = await IssueHandler.queueIssueGeneration(card, profile, price);
    let tries = 0;
    while (true) {
      try {
        const query = (await DB.query(
          `INSERT INTO user_card (card_id, serial_number, discord_id, original_owner, wear, luck_coeff, frame, claim_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            issue,
            profile.discordId,
            profile.discordId,
            wear,
            luckCoefficient,
            frame,
            claimTime,
          ]
        )) as { insertId: number };
        zephyr.getCard(card.id).serialTotal = issue;
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
  public static async transferCardsToUser(
    cards: GameUserCard[],
    discordId: string
  ): Promise<void> {
    await DB.query(
      `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
      [discordId, cards.map((c) => c.id)]
    );
    return;
  }
  public static async dismantleCards(
    cards: GameUserCard[],
    zephyrId: string
  ): Promise<void> {
    await DB.query(
      `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
      [zephyrId, cards.map((c) => c.id)]
    );
    return;
  }

  public static async setCardsTag(
    cards: GameUserCard[],
    tagId: number
  ): Promise<void> {
    await DB.query(`UPDATE user_card SET tag_id=? WHERE id IN (?);`, [
      tagId,
      cards.map((c) => c.id),
    ]);
    return;
  }

  public static async incrementGenerated(cards: GameBaseCard[]): Promise<void> {
    await DB.query(
      `UPDATE card_base SET num_generated=num_generated+1 WHERE id IN (?);`,
      [cards.map((c) => c.id)]
    );
    return;
  }

  public static async unsetCardsTag(cards: GameUserCard[]): Promise<void> {
    await DB.query(`UPDATE user_card SET tag_id=NULL WHERE id IN (?);`, [
      cards.map((c) => c.id),
    ]);
    return;
  }

  public static async increaseCardWear(card: GameUserCard): Promise<void> {
    await DB.query(`UPDATE user_card SET wear=wear+1 WHERE id=?;`, [card.id]);
    return;
  }

  public static async setCardDye(
    card: GameUserCard,
    dye: GameDye
  ): Promise<void> {
    await DB.query(
      `UPDATE user_card SET dye_r=?, dye_g=?, dye_b=? WHERE id=?;`,
      [dye.dyeR, dye.dyeG, dye.dyeB, card.id]
    );
    return;
  }
}
