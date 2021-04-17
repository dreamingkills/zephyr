import { DB } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameBaseCard } from "../../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { IssueHandler } from "../../../../IssueHandler";
import { CardService } from "../../../services/game/CardService";
import { Chance } from "chance";
import { GameDye } from "../../../../../structures/game/Dye";
import {
  BuiltSticker,
  GameCardSticker,
} from "../../../../../structures/game/Sticker";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { AlbumService } from "../../../services/game/AlbumService";

export async function createNewUserCard(
  card: GameBaseCard,
  profile: GameProfile,
  zephyr: Zephyr
): Promise<GameUserCard> {
  const chance = new Chance();
  const wear = chance.weighted(
    [0, 1, 2, 3, 4, 5],
    [12.5, 25, 35, 23.6, 14.6, 4]
  );

  const luck = chance.floating({ min: 0, max: 1 });

  let issue = await IssueHandler.queueIssueGeneration(card);
  let tries = 0;
  while (true) {
    try {
      const query = (await DB.query(
        `INSERT INTO user_card (card_id, serial_number, discord_id, wear, luck_coeff) VALUES (?, ?, ?, ?, ?)`,
        [card.id, issue, profile.discordId, wear, luck]
      )) as { insertId: number };

      zephyr.incrementBaseCardSerialNumber(card);

      return await CardService.getUserCardById(query.insertId);
    } catch (e) {
      if (++tries === 3) throw e;
      issue++;
    }
  }
}

export async function setCardFrame(
  card: GameUserCard,
  frameId: number
): Promise<GameUserCard> {
  await DB.query(`UPDATE user_card SET frame=? WHERE id=?;`, [
    frameId,
    card.id,
  ]);
  return await card.fetch();
}

export async function transferCardsToUser(
  cards: GameUserCard[],
  discordId: string
): Promise<void> {
  for (let card of cards) {
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== card.discordId)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(refetchCard);

    if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetchCard);
  }

  await DB.query(
    `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
    [discordId, cards.map((c) => c.id)]
  );
  return;
}

export async function burnCards(
  cards: GameUserCard[],
  zephyrId: string
): Promise<void> {
  for (let card of cards) {
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== card.discordId)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(refetchCard);

    if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetchCard);
  }

  await DB.query(
    `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
    [zephyrId, cards.map((c) => c.id)]
  );
  return;
}

export async function setCardsTag(
  cards: GameUserCard[],
  tagId: number
): Promise<void> {
  for (let card of cards) {
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== card.discordId)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);
  }

  await DB.query(`UPDATE user_card SET tag_id=? WHERE id IN (?);`, [
    tagId,
    cards.map((c) => c.id),
  ]);
  return;
}

export async function incrementGenerated(cards: GameBaseCard[]): Promise<void> {
  await DB.query(
    `UPDATE card_base SET num_generated=num_generated+1 WHERE id IN (?);`,
    [cards.map((c) => c.id)]
  );
  return;
}

export async function unsetCardsTag(cards: GameUserCard[]): Promise<void> {
  await DB.query(`UPDATE user_card SET tag_id=NULL WHERE id IN (?);`, [
    cards.map((c) => c.id),
  ]);
  return;
}

export async function increaseCardWear(card: GameUserCard): Promise<void> {
  await DB.query(`UPDATE user_card SET wear=wear+1 WHERE id=?;`, [card.id]);
  return;
}

export async function setCardDye(
  card: GameUserCard,
  dye: GameDye
): Promise<void> {
  await DB.query(`UPDATE user_card SET dye_r=?, dye_g=?, dye_b=? WHERE id=?;`, [
    dye.dyeR,
    dye.dyeG,
    dye.dyeB,
    card.id,
  ]);
  return;
}

export async function addStickerToCard(
  card: GameUserCard,
  sticker: BuiltSticker,
  position: number
): Promise<void> {
  await DB.query(
    `INSERT INTO card_sticker (card_id, sticker_id, position) VALUES (?, ?, ?);`,
    [card.id, sticker.id, position]
  );
  return;
}

export async function removeCardSticker(
  sticker: GameCardSticker
): Promise<void> {
  await DB.query(`DELETE FROM card_sticker WHERE id=?;`, [sticker.id]);

  return;
}

export async function setCardsVaulted(cards: GameUserCard[]): Promise<void> {
  await DB.query(
    `
      UPDATE
        user_card
      SET
        vaulted=1
      WHERE
        id IN (?);
      `,
    [cards.map((c) => c.id)]
  );

  return;
}

export async function unsetCardsVaulted(cards: GameUserCard[]): Promise<void> {
  await DB.query(
    `
      UPDATE
        user_card
      SET
        vaulted=0
      WHERE
        id IN (?);
    `,
    [cards.map((c) => c.id)]
  );

  return;
}

export * as CardSet from "./CardSet";
