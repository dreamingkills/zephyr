import { createCanvas, loadImage } from "canvas";
import { GameBaseCard } from "../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../structures/game/Profile";
import {
  GameUserCard,
  MockUserCard,
} from "../../../../structures/game/UserCard";
import { Filter } from "../../sql/Filters";
import { CardGet, WearSpread } from "../../sql/game/card/CardGet";
import fs from "fs/promises";
import { CardSet } from "../../sql/game/card/CardSet";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameTag } from "../../../../structures/game/Tag";
import { GameDye } from "../../../../structures/game/Dye";
import { hexToRgb } from "../../../utility/color/ColorUtils";
import {
  BuiltSticker,
  GameCardSticker,
  GameSticker,
} from "../../../../structures/game/Sticker";
import { AnticheatService } from "../meta/AnticheatService";
import { Frames } from "../../../cosmetics/Frames";
import { Logger, loggerSettings } from "../../../logger/Logger";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { exec } from "child_process";
import { promisify } from "util";

export const _exec = promisify(exec);

export async function generateCardImage(
  card: GameUserCard | MockUserCard,
  large: boolean
): Promise<Buffer> {
  console.log(Date.now());
  let baseCard: GameBaseCard;
  let frame = card.frame;

  if (card instanceof GameUserCard) {
    baseCard = Zephyr.getCard(card.baseCardId)!;
  } else {
    baseCard = card.baseCard;
  }

  let groupUrl = ``;

  if (baseCard.group) {
    groupUrl = `./src/assets/groups/${baseCard.group
      .toLowerCase()
      .replace(`*`, ``)}`;

    if (!large) groupUrl += `_small`;

    groupUrl += `.png`;
  }

  let idolImage = baseCard.image;
  let frameImage = frame.frameUrl;
  let maskImage = frame.maskUrl;
  let outPath = `./cache/cards/${baseCard.id}/${card.id}`;

  if (!large) {
    idolImage = idolImage.slice(0, -4) + `_small.png`;
    frameImage = frameImage.slice(0, -4) + `_small.png`;
    maskImage = maskImage.slice(0, -4) + `_small.png`;
    outPath += `_small`;
  }

  const textColor = hexToRgb(frame.textColor);

  try {
    await fs.readdir(`./cache/cards/${baseCard.id}`);
  } catch {
    await fs.mkdir(`./cache/cards/${baseCard.id}`);
  }

  console.log(outPath);
  console.log(card.dye);

  await _exec(
    `./envision_card "${baseCard.name}" ${
      card.serialNumber
    } ${!!baseCard.group} "${idolImage}" "${groupUrl}" "${frameImage}" "${maskImage}" ${
      card.id
    } ${card.dye.r < 0 ? 185 : card.dye.r} ${
      card.dye.g < 0 ? 185 : card.dye.g
    } ${
      card.dye.b < 0 ? 185 : card.dye.b
    } ${large} "./src/assets/fonts/AlteHaasGroteskBold.ttf" ${textColor.r} ${
      textColor.g
    } ${textColor.b} "${outPath}"`
  );

  console.log(outPath);

  const cardImage = await fs.readFile(outPath);
  console.log(Date.now());
  return cardImage;
}

export async function generateCardPrefab(card: GameBaseCard): Promise<void> {
  const frame = Frames.getFrameById(1)!;
  const executed = await _exec(
    `./envision_prefab "${card.name}" "${card.image.slice(
      0,
      -4
    )}_small.png" "${frame.frameUrl.slice(
      0,
      -4
    )}_small.png" "${frame.maskUrl.slice(
      0,
      -4
    )}_small.png" ${!!card.group} "./src/assets/groups/${card.group
      ?.toLowerCase()
      .replace(`*`, ``)}_small.png" "./cache/cards/prefab/${card.id}"`
  );

  if (executed.stderr?.length > 0) {
    Logger.error(
      `Unexpected error generating prefab ${card.id}: \n${executed.stderr}`
    );
  }

  return;
}

export abstract class CardService {
  public static async getAllCards(): Promise<GameBaseCard[]> {
    return await CardGet.getAllCards();
  }

  public static async getCardById(id: number): Promise<GameBaseCard> {
    return await CardGet.getCardById(id);
  }

  /*
      UserCards
  */
  public static async createNewUserCard(
    card: GameBaseCard,
    profile: GameProfile
  ): Promise<GameUserCard> {
    const newCard = await CardSet.createNewUserCard(card, profile);
    return newCard;
  }

  public static async getUserCardById(id: number): Promise<GameUserCard> {
    return await CardGet.getUserCardById(id);
  }

  public static async getUserCardByIdentifier(
    identifier: string
  ): Promise<GameUserCard> {
    const id = parseInt(identifier, 36);
    if (isNaN(id)) throw new ZephyrError.InvalidCardReferenceError();
    return await this.getUserCardById(id);
  }

  public static async getUserInventory(
    profile: GameProfile,
    tags: GameTag[],
    options: Filter
  ): Promise<GameUserCard[]> {
    return await CardGet.getUserInventory(profile, options, tags);
  }

  public static async getVaultedCards(
    profile: GameProfile
  ): Promise<GameUserCard[]> {
    return await CardGet.getVaultedCards(profile);
  }

  public static async getUserInventorySize(
    profile: GameProfile,
    tags: GameTag[],
    options: Filter
  ): Promise<number> {
    return await CardGet.getUserInventorySize(profile, options, tags);
  }

  /*public static async _generateCardImage(
    card: GameUserCard | MockUserCard,
    noText: boolean = false,
    large: boolean = false
  ): Promise<Buffer> {
    const stickers = await this.getCardStickers(card);
    if (stickers.length > 0) {
      const size = 64 * sizeCoefficient;
      for (let sticker of stickers) {
        const gameSticker = Stickers.getStickerById(sticker.stickerId);
        if (!gameSticker) continue;

        const posX =
          82 * sizeCoefficient +
          (sticker.position - 1 - Math.floor((sticker.position - 1) / 4) * 4) *
            (62 * sizeCoefficient);
        const posY =
          90 * sizeCoefficient +
          Math.floor((sticker.position - 1) / 4) * (68 * sizeCoefficient);

        ctx.save();

        ctx.translate(posX, posY);
        ctx.drawImage(gameSticker.image, -size / 2, -size / 2, size, size);

        ctx.restore();
      }
    }
  }*/

  public static async drawCardFromPrefab(
    card: GameBaseCard,
    serial: number
  ): Promise<Buffer> {
    let prefab: Buffer;

    try {
      prefab = await fs.readFile(`./cache/cards/prefab/${card.id}`);
    } catch (e) {
      prefab = await this.updatePrefabCache(card);
    }

    // Create the card canvas
    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext(`2d`);

    // Load the base card image
    let img = await loadImage(prefab);

    // Draw the base image
    ctx.drawImage(img, 0, 0, 350, 500);

    // Draw the serial number
    ctx.font = "20px AlteHaasGroteskBold";
    ctx.fillText(`#${serial}`, 50, 421);

    return canvas.toBuffer(`image/png`);
  }

  public static async generateCardCollage(
    cards: MockUserCard[]
  ): Promise<Buffer> {
    // Create the collage canvas
    const canvas = createCanvas(cards.length * 350, 500);
    const ctx = canvas.getContext("2d");

    // Generate each card image and draw it on the collage
    ctx.font = "14px AlteHaasGroteskBold";
    for (let [i, card] of cards.entries()) {
      const cardBuffer = await this.getPrefabFromCache(card.baseCard);

      const img = await loadImage(cardBuffer);
      ctx.drawImage(img, i * 350, 0, 350, 500);
    }

    // Send it off!
    return canvas.toBuffer("image/png");
  }

  public static async generateStickerPreview(
    card: GameUserCard,
    sticker?: GameSticker,
    position?: number,
    useOverlay: boolean = true
  ): Promise<Buffer> {
    const cardBuffer = await CardService.checkCacheForCard(card);

    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    // const rot = parseInt(options[3]);

    const cardImage = await loadImage(cardBuffer);
    ctx.drawImage(cardImage, 0, 0);
    if (useOverlay) {
      const overlay = await loadImage(`./src/assets/stickers/overlay.png`);
      ctx.drawImage(overlay, 0, 0, 350, 500);
    }

    if (sticker) {
      if (!position) position = 1;

      const posX = 82 + (position - Math.floor(position / 4) * 4) * 62;
      const posY = 90 + Math.floor(position / 4) * 68;

      ctx.save();

      ctx.translate(posX, posY);

      ctx.drawImage(sticker.image, -64 / 2, -64 / 2, 64, 64);

      ctx.restore();
    }

    return canvas.toBuffer("image/png");
  }

  public static async changeCardFrame(
    card: GameUserCard,
    frameId: number
  ): Promise<Buffer> {
    const newCard = await CardSet.setCardFrame(card, frameId);
    return await this.updateCardCache(newCard, false, true);
  }

  public static async transferCardsToUser(
    cards: GameUserCard[],
    profile: GameProfile
  ): Promise<void> {
    await CardSet.transferCardsToUser(cards, profile.discordId);
    return;
  }

  public static async burnCards(
    profile: GameProfile,
    cards: GameUserCard[]
  ): Promise<void> {
    await AnticheatService.logBurn(profile, cards);
    return await CardSet.burnCards(cards);
  }

  /*
      Caching
  */
  public static async updateCardCache(
    card: GameUserCard,
    large: boolean = false,
    invalidate: boolean = false
  ): Promise<Buffer> {
    const image = await generateCardImage(card, large);

    const fileName = `${card.id}${large ? `` : `_small`}`;
    const tempFile = `./cache/cards/temp/${fileName}`;
    const finalFile = `./cache/cards/${card.baseCardId}/${fileName}`;

    // fs will throw an error if the directory already exists.
    // TODO - Change this do detect directory, removing need for error handling.
    try {
      await fs.mkdir(`./cache/cards/${card.baseCardId}`);
    } catch (e) {}

    // Overwrite the cached card image.
    // The card image file stays in the temp folder while it's building.
    // Once it's finished, it's moved to the cache folder to avoid
    // showing users incomplete card images.
    await fs.writeFile(tempFile, image);
    await fs.rename(tempFile, finalFile);

    // Cache invalidator
    if (invalidate) {
      try {
        if (large) {
          await fs.unlink(`./cache/cards/${card.baseCardId}/${card.id}_small`);
        } else await fs.unlink(`./cache/cards/${card.baseCardId}/${card.id}`);
      } catch {}
    }

    return await fs.readFile(finalFile);
  }

  public static async generatePrefabCache(card: GameBaseCard): Promise<Buffer> {
    try {
      await fs.readFile(`./cache/cards/prefab/${card.id}`);

      if (loggerSettings.verbose) {
        Logger.verbose(`Read prefab ${card.id} from disk.`);
      }
    } catch {
      await generateCardPrefab(card);

      if (loggerSettings.verbose) {
        Logger.verbose(`Generated prefab ${card.id} and saved it to disk.`);
      }
    }

    return await fs.readFile(`./cache/cards/prefab/${card.id}`);
  }

  public static async updatePrefabCache(card: GameBaseCard): Promise<Buffer> {
    await generateCardPrefab(card);
    return await fs.readFile(`./cache/cards/prefab/${card.id}`);
  }

  public static async getPrefabFromCache(card: GameBaseCard): Promise<Buffer> {
    let prefab: Buffer;
    try {
      prefab = await fs.readFile(`./cache/cards/prefab/${card.id}`);
    } catch {
      await generateCardPrefab(card);
      prefab = await fs.readFile(`./cache/cards/prefab/${card.id}`);
    }

    return prefab;
  }

  public static async checkCacheForCard(
    card: GameUserCard,
    large: boolean = false,
    invalidate: boolean = false
  ): Promise<Buffer> {
    try {
      return await fs.readFile(
        `./cache/cards/${card.baseCardId}/${card.id}${large ? `` : `_small`}`
      );
    } catch (e) {
      return await this.updateCardCache(card, large, invalidate);
    }
  }

  public static async setCardsTag(
    cards: GameUserCard[],
    tagId: number
  ): Promise<void> {
    return await CardSet.setCardsTag(cards, tagId);
  }

  public static async unsetCardsTag(cards: GameUserCard[]): Promise<void> {
    return await CardSet.unsetCardsTag(cards);
  }

  public static async getNumberOfTopCollectors(ids: number[]): Promise<number> {
    return await CardGet.getNumberOfTopCollectors(ids);
  }

  public static async getTopCollectorsByBaseIds(
    ids: number[],
    page: number = 1
  ): Promise<{ discordId: string; amount: number }[]> {
    return await CardGet.getTopCollectorsByBaseIds(ids, page);
  }

  public static async getNumberOfTopWishlisted(): Promise<number> {
    return await CardGet.getNumberOfTopWishlisted();
  }

  public static async getTopWishlisted(
    page: number = 1
  ): Promise<{ idol_id: number; count: number }[]> {
    return await CardGet.getTopWishlisted(page);
  }

  public static async increaseCardWear(card: GameUserCard): Promise<void> {
    return await CardSet.increaseCardWear(card);
  }

  public static async getCardsByTag(
    tag: GameTag,
    profile: GameProfile
  ): Promise<GameUserCard[]> {
    return await CardGet.getCardsByTagId(tag.id, profile);
  }

  public static async getUntaggedCards(
    profile: GameProfile
  ): Promise<GameUserCard[]> {
    return await CardGet.getUntaggedCards(profile.discordId);
  }

  public static async incrementGenerated(cards: GameBaseCard[]): Promise<void> {
    return await CardSet.incrementGenerated(cards);
  }

  public static async getTimesCardDestroyed(
    card: GameBaseCard
  ): Promise<number> {
    return await CardGet.getTimesCardDestroyed(card.id);
  }
  public static async getTimesCardWishlisted(
    card: GameBaseCard
  ): Promise<number> {
    return await CardGet.getTimesCardWishlisted(card);
  }

  public static async getAverageClaimTime(card: GameBaseCard): Promise<number> {
    return await CardGet.getAverageClaimTime(card.id);
  }

  public static async getCardWearSpread(
    card: GameBaseCard
  ): Promise<WearSpread> {
    return await CardGet.getCardWearSpread(card.id);
  }

  public static async setCardDye(
    card: GameUserCard,
    dye: GameDye
  ): Promise<GameUserCard> {
    await CardSet.setCardDye(card, dye);
    return await card.fetch();
  }

  /*
      Stickers
  */
  public static async getCardStickers(
    card: GameUserCard | MockUserCard
  ): Promise<GameCardSticker[]> {
    return await CardGet.getCardStickers(card);
  }

  public static async addStickerToCard(
    card: GameUserCard,
    sticker: BuiltSticker,
    position: number
  ): Promise<GameUserCard> {
    await CardSet.addStickerToCard(card, sticker, position);
    return await card.fetch();
  }

  public static async removeCardSticker(
    card: GameUserCard,
    sticker: GameCardSticker
  ): Promise<Buffer> {
    await CardSet.removeCardSticker(sticker);

    return await this.updateCardCache(card, false, true);
  }

  public static async getLastCard(profile: GameProfile): Promise<GameUserCard> {
    return await CardGet.getLastCard(profile);
  }

  public static async getRandomConfiscatedCard(
    confiscatedTag: GameTag
  ): Promise<GameUserCard> {
    return await CardGet.getRandomConfiscatedCard(confiscatedTag);
  }

  public static async calculateBurnValue(card: GameUserCard): Promise<number> {
    const claimRecord = await AnticheatService.getClaimInformation(card);

    let base = 10;

    if (card.wear === 5) {
      if (card.frame.id !== 1 && card.frame.id) base *= 10;
      if (card.dye.r >= 0 && card.dye.g >= 0 && card.dye.b >= 0) base *= 1.8;
    }

    if (claimRecord.claimer === card.discordId) base += 15;

    const final = Math.floor(base * [0.1, 0.3, 0.5, 0.7, 1, 1.2][card.wear]);

    return final;
  }

  public static async setCardsVaulted(cards: GameUserCard[]): Promise<void> {
    return await CardSet.setCardsVaulted(cards);
  }

  public static async unsetCardsVaulted(cards: GameUserCard[]): Promise<void> {
    return await CardSet.unsetCardsVaulted(cards);
  }
}
