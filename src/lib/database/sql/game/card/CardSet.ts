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
import { ProfileSetter } from "../profile/ProfileSetter";

export async function createNewUserCard(
  card: GameBaseCard,
  profile: GameProfile
): Promise<GameUserCard> {
  const chance = new Chance();
  const wear = chance.weighted(
    [0, 1, 2, 3, 4, 5],
    [12.5, 25, 35, 23.6, 14.6, 4]
  );

  const isUnusual = chance.bool({
    likelihood: card.totalGenerated < 500 ? 5 : 0.5,
  });

  let issue = await IssueHandler.queueIssueGeneration(card);
  let tries = 0;
  while (true) {
    try {
      const query = (await DB.query(
        `INSERT INTO user_card (card_id, serial_number, discord_id, wear, unusual) VALUES (?, ?, ?, ?, ?)`,
        [card.id, issue, profile.discordId, wear, isUnusual]
      )) as { insertId: number };

      Zephyr.incrementBaseCardSerialNumber(card);

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
  giver: GameProfile,
  receiver: GameProfile
): Promise<void> {
  for (let card of cards) {
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== card.discordId)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(refetchCard);

    if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetchCard);

    if (giver.activeCard === card.id)
      await ProfileSetter.unsetActiveCard(giver);
  }

  await DB.query(
    `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
    [receiver.discordId, cards.map((c) => c.id)]
  );
  return;
}

export async function burnCards(
  cards: GameUserCard[],
  burner: GameProfile
): Promise<void> {
  for (let card of cards) {
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== card.discordId)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(refetchCard);

    if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetchCard);

    if (burner.activeCard === card.id)
      await ProfileSetter.unsetActiveCard(burner);
  }

  await DB.query(
    `UPDATE user_card SET discord_id=?,tag_id=NULL WHERE id IN (?);`,
    [Zephyr.user.id, cards.map((c) => c.id)]
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

export async function addExperience(
  card: GameUserCard,
  amount: number
): Promise<GameUserCard> {
  await DB.query(
    `
    UPDATE
      user_card
    SET
      experience = experience + ?,
      updated_at = updated_at
    WHERE
      id = ?;
    `,
    [amount, card.id]
  );

  return await card.fetch();
}

export * as CardSet from "./CardSet";
