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
import { Zephyr } from "../../../../structures/client/Zephyr";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameTag } from "../../../../structures/game/Tag";
import gm from "gm";
import { GameDye } from "../../../../structures/game/Dye";
import { hexToCmy, rgbToCmy } from "../../../utility/color/ColorUtils";
import {
  BuiltSticker,
  GameCardSticker,
  GameSticker,
} from "../../../../structures/game/Sticker";
import { AnticheatService } from "../meta/AnticheatService";
import { Frame } from "../../../../structures/game/Frame";

export abstract class CardService {
  // Used for card image generation
  private static toBufferPromise(state: gm.State): Promise<Buffer> {
    return new Promise(function resolvePromise(resolve) {
      try {
        state.toBuffer((err, buf) => {
          if (err) throw err;
          resolve(buf);
        });
      } catch (err) {
        throw err;
      }
    });
  }

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
    profile: GameProfile,
    zephyr: Zephyr
  ): Promise<GameUserCard> {
    const newCard = await CardSet.createNewUserCard(card, profile, zephyr);
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

  public static async generateCardImage(
    card: GameUserCard | MockUserCard,
    zephyr: Zephyr,
    noText: boolean = false,
    large: boolean = false
  ): Promise<Buffer> {
    let baseCard;

    // Need information off the base card to do anything.
    if (card instanceof GameUserCard) {
      baseCard = zephyr.getCard(card.baseCardId)!;
    } else baseCard = card.baseCard;

    const sizeCoefficient = large ? 2.2 : 1;

    const [sizeX, sizeY] = large ? [770, 1100] : [350, 500];

    // Create the card canvas
    const canvas = createCanvas(sizeX, sizeY);
    const ctx = canvas.getContext("2d");

    // Load the base card image (the subject of the card)

    let img = await loadImage(baseCard.image);

    // Load the card's frame, default if the id column is null
    let frame;

    if (card instanceof GameUserCard) {
      frame = zephyr.getFrameById(card.frameId || 1);
    } else frame = card.frame;

    // Draw the base image, then the frame on top of that
    ctx.drawImage(img, 0, 0, sizeX, sizeY);

    let [r, g, b] = [185, 185, 185];

    if (card.dye.r >= 0) r = card.dye.b;
    if (card.dye.g >= 0) g = card.dye.g;
    if (card.dye.b >= 0) b = card.dye.b;

    const { c, m, y } = rgbToCmy(r, g, b);

    if (frame.overlay) {
      // We need to convert the GM State to a buffer, so that
      // canvas knows what to do with it.
      const dyeBuffer = await this.toBufferPromise(
        gm(frame.mask).colorize(c, m, y)
      );
      const dyeImage = await loadImage(dyeBuffer);

      ctx.drawImage(dyeImage, 0, 0, sizeX, sizeY);
    }

    if (frame) ctx.drawImage(frame.frame, 0, 0, sizeX, sizeY);

    if (!frame.overlay) {
      const dyeBuffer = await this.toBufferPromise(
        gm(frame.mask).colorize(c, m, y)
      );
      const dyeImage = await loadImage(dyeBuffer);

      ctx.drawImage(dyeImage, 0, 0, sizeX, sizeY);
    }

    // Draw the stickers, if any
    const stickers = await this.getCardStickers(card);
    if (stickers.length > 0) {
      const size = 64 * sizeCoefficient;
      for (let sticker of stickers) {
        const gameSticker = zephyr.getStickerById(sticker.stickerId);
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

    const textX = 50 * sizeCoefficient;
    const serialFontSize = 20 * sizeCoefficient;
    const serialY = 421 * sizeCoefficient;
    const nameFontSize = 30 * sizeCoefficient;
    const nameY = 445 * sizeCoefficient;

    if (!noText) {
      let textColor;

      if (card instanceof GameUserCard) {
        textColor = card.textColor;
      } else textColor = card.frame.textColor;

      // Draw the group icon
      if (baseCard.group) {
        if (textColor !== `000000`) {
          const cmy = hexToCmy(textColor);

          const dyeBuffer = await this.toBufferPromise(
            gm(
              `./src/assets/groups/${baseCard.group
                .toLowerCase()
                .replace(`*`, ``)}.png`
            )
              .negative()
              .colorize(cmy.c, cmy.m, cmy.y)
          );

          // Load the buffer and draw the dye mask on top of the frame.
          const dyeImage = await loadImage(dyeBuffer);

          ctx.drawImage(dyeImage, 0, 0, sizeX, sizeY);
        } else {
          const overlay = await loadImage(
            `./src/assets/groups/${baseCard.group
              ?.toLowerCase()
              .replace(`*`, ``)}.png`
          );

          ctx.drawImage(overlay, 0, 0, sizeX, sizeY);
        }
      }

      ctx.fillStyle = `#${textColor}`;

      // Draw the serial number
      ctx.font = `${serialFontSize}px AlteHaasGroteskBold`;
      ctx.fillText(`#${card.serialNumber}`, textX, serialY);

      // Draw the name of the subject
      ctx.font = `${nameFontSize}px AlteHaasGroteskBold`;
      ctx.fillText(`${baseCard.name}`, textX, nameY);
    }

    return canvas.toBuffer("image/png");
  }

  public static async generateCardPrefab(card: GameBaseCard): Promise<Buffer> {
    // Create the card canvas
    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    // Load the base card image (the subject of the card)
    let img = await loadImage(card.image);

    // Load the card's frame, default if the id column is null
    let frame = await loadImage(
      `./src/assets/frames/default/frame-default.png`
    );

    // Draw the base image, then the frame on top of that
    ctx.drawImage(img, 0, 0, 350, 500);
    ctx.drawImage(frame, 0, 0, 350, 500);

    // Handle dye mask (this was so annoying to set up I hate Windows)
    // Default to the classic "Undyed Mask Gray" if the card is undyed.
    const { c, m, y } = rgbToCmy(185, 185, 185);

    // We need to convert the GM State to a buffer, so that
    // canvas knows what to do with it.
    const dyeBuffer = await this.toBufferPromise(
      gm(`./src/assets/frames/default/mask-default.png`).colorize(c, m, y)
    );

    // Load the buffer and draw the dye mask on top of the frame.
    const dyeImage = await loadImage(dyeBuffer);
    ctx.drawImage(dyeImage, 0, 0, 350, 500);

    // Draw the group icon
    const overlay = await loadImage(
      `./src/assets/groups/${
        card.group?.toLowerCase().replace("*", "") || "nogroup"
      }.png`
    );
    ctx.drawImage(overlay, 0, 0, 350, 500);

    // Draw the name of the subject
    ctx.font = "30px AlteHaasGroteskBold";
    ctx.fillText(`${card.name}`, 50, 445);

    // Send it off!
    return canvas.toBuffer("image/png");
  }

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

    ctx.beginPath();
    ctx.rect(0, 0, 350, 500);
    ctx.fillStyle = "#36393E";
    ctx.fill();

    ctx.fillStyle = `#000000`;

    // Draw the base image
    ctx.drawImage(img, 0, 0, 350, 500);

    // Draw the serial number
    ctx.font = "20px AlteHaasGroteskBold";
    ctx.fillText(`#${serial}`, 50, 421);

    return canvas.toBuffer(`image/jpeg`);
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
      const cardBuffer = await this.drawCardFromPrefab(
        card.baseCard,
        card.serialNumber
      );

      const img = await loadImage(cardBuffer);
      ctx.drawImage(img, i * 350, 0, 350, 500);
    }

    // Send it off!
    return canvas.toBuffer("image/jpeg");
  }

  public static async generateStickerPreview(
    card: GameUserCard,
    zephyr: Zephyr,
    sticker?: GameSticker,
    position?: number,
    useOverlay: boolean = true
  ): Promise<Buffer> {
    const cardBuffer = await CardService.checkCacheForCard(card, zephyr);

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
      // ctx.rotate((Math.PI / 180) * rot);

      ctx.drawImage(sticker.image, -64 / 2, -64 / 2, 64, 64);

      ctx.restore();
    }

    return canvas.toBuffer("image/png");
  }

  public static async changeCardFrame(
    card: GameUserCard,
    frameId: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const newCard = await CardSet.setCardFrame(card, frameId);
    return await this.updateCardCache(newCard, zephyr);
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
    cards: GameUserCard[],
    zephyr: Zephyr
  ): Promise<void> {
    await AnticheatService.logBurn(profile, cards);
    return await CardSet.burnCards(cards, zephyr.user.id);
  }

  /*
      Caching
  */
  public static async updateCardCache(
    card: GameUserCard,
    zephyr: Zephyr,
    large: boolean = false,
    invalidate: boolean = false
  ): Promise<Buffer> {
    const image = await this.generateCardImage(card, zephyr, false, large);

    const fileName = `${card.id}${large ? `_large` : ``}`;
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
          await fs.unlink(`./cache/cards/${card.baseCardId}/${card.id}`);
        } else
          await fs.unlink(`./cache/cards/${card.baseCardId}/${card.id}_large`);
      } catch {}
    }

    return await fs.readFile(finalFile);
  }

  public static async generatePrefabCache(card: GameBaseCard): Promise<Buffer> {
    try {
      await fs.readFile(`./cache/cards/prefab/${card.id}`);
      console.log(`Skipping ${card.id}`);
    } catch {
      const image = await this.generateCardPrefab(card);
      await fs.writeFile(`./cache/cards/prefab/${card.id}`, image);
      console.log(`Generated ${card.id}`);
    }

    return await fs.readFile(`./cache/cards/prefab/${card.id}`);
  }

  public static async updatePrefabCache(card: GameBaseCard): Promise<Buffer> {
    const image = await this.generateCardPrefab(card);
    await fs.writeFile(`./cache/cards/prefab/${card.id}`, image);

    return image;
  }

  public static async getPrefabFromCache(card: GameBaseCard): Promise<Buffer> {
    let prefab: Buffer;
    try {
      prefab = await fs.readFile(`./cache/cards/prefab/${card.id}`);
    } catch {
      const image = await this.generateCardPrefab(card);
      await fs.writeFile(`./cache/cards/prefab/${card.id}`, image);

      prefab = image;
    }

    return prefab;
  }

  public static async checkCacheForCard(
    card: GameUserCard,
    zephyr: Zephyr,
    large: boolean = false,
    invalidate: boolean = false
  ): Promise<Buffer> {
    try {
      return await fs.readFile(
        `./cache/cards/${card.baseCardId}/${card.id}${large ? `_large` : ``}`
      );
    } catch (e) {
      return await this.updateCardCache(card, zephyr, large, invalidate);
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

  public static async getNumberOfTopCollectors(
    ids: number[],
    zephyr: Zephyr
  ): Promise<number> {
    return await CardGet.getNumberOfTopCollectors(ids, zephyr.user.id);
  }

  public static async getTopCollectorsByBaseIds(
    ids: number[],
    zephyr: Zephyr,
    page: number = 1
  ): Promise<{ discordId: string; amount: number }[]> {
    return await CardGet.getTopCollectorsByBaseIds(ids, zephyr.user.id, page);
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
    card: GameBaseCard,
    zephyr: Zephyr
  ): Promise<number> {
    return await CardGet.getTimesCardDestroyed(card.id, zephyr.user.id);
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
    card: GameBaseCard,
    zephyr: Zephyr
  ): Promise<WearSpread> {
    return await CardGet.getCardWearSpread(card.id, zephyr.user.id);
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
    zephyr: Zephyr,
    sticker: GameCardSticker
  ): Promise<Buffer> {
    await CardSet.removeCardSticker(sticker);

    return await this.updateCardCache(card, zephyr, false, true);
  }

  public static async getLastCard(profile: GameProfile): Promise<GameUserCard> {
    return await CardGet.getLastCard(profile);
  }

  public static async getRandomConfiscatedCard(
    confiscatedTag: GameTag
  ): Promise<GameUserCard> {
    return await CardGet.getRandomConfiscatedCard(confiscatedTag);
  }

  public static async getAllFrames(): Promise<Frame[]> {
    return await CardGet.getAllFrames();
  }

  public static async calculateBurnValue(card: GameUserCard): Promise<number> {
    const claimRecord = await AnticheatService.getClaimInformation(card);

    let base = 10;

    if (card.wear === 5) {
      if (card.frameId !== 1 && card.frameId) base *= 10;
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
