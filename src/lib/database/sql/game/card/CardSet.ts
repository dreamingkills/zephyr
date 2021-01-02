import { DB, DBClass } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameBaseCard } from "../../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { IssueHandler } from "../../../../IssueHandler";
import { CardService } from "../../../services/game/CardService";
import { Chance } from "chance";
import { GameDye } from "../../../../../structures/game/Dye";
import { GameSticker } from "../../../../../structures/game/Sticker";
export abstract class CardSet extends DBClass {
  public static async createNewUserCard(
    card: GameBaseCard,
    profile: GameProfile,
    zephyr: Zephyr,
    price: number,
    claimTime: number,
    dropper: GameProfile | null,
    fightCount: number,
    frame?: number
  ): Promise<GameUserCard> {
    const chance = new Chance();
    const wear = chance.weighted(
      [0, 1, 2, 3, 4, 5],
      [10, 25, 30, 23.6, 14.6, 6.6]
    );
    const luckCoefficient = chance.floating({ min: 0, max: 1, fixed: 10 });
    let issue = await IssueHandler.queueIssueGeneration(card, profile, price);
    let tries = 0;
    while (true) {
      try {
        const query = (await DB.query(
          `INSERT INTO user_card (card_id, serial_number, discord_id, original_owner, wear, luck_coeff, frame, claim_time, dropper, fight_count, original_wear) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            issue,
            profile.discordId,
            profile.discordId,
            wear,
            luckCoefficient,
            frame,
            claimTime,
            dropper ? dropper.discordId : null,
            fightCount,
            wear,
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
    return await card.fetch();
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

  public static async burnCards(
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

  public static async addStickerToCard(
    card: GameUserCard,
    sticker: GameSticker,
    position: number
  ): Promise<void> {
    await DB.query(
      `INSERT INTO card_sticker (card_id, sticker_id, position) VALUES (?, ?, ?);`,
      [card.id, sticker.id, position]
    );
    return;
  }
}
