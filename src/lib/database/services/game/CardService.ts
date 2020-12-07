import { createCanvas, loadImage, Image } from "canvas";
import { GameBaseCard, GameFrame } from "../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { Filter } from "../../sql/Filters";
import { CardGet } from "../../sql/game/card/CardGet";
import fs from "fs/promises";
import { CardSet } from "../../sql/game/card/CardSet";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { GameDroppedCard } from "../../../../structures/game/DroppedCard";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameTag } from "../../../../structures/game/Tag";

export abstract class CardService {
  public static getCardDescription(
    card: GameUserCard,
    zephyr: Zephyr,
    pad: { reference: number; issue: number },
    tag?: GameTag
  ): string {
    const baseCard = zephyr.getCard(card.baseCardId);
    return (
      `${tag?.emoji || `:white_medium_small_square:`} \`${card.id
        .toString(36)
        .padStart(pad.reference, " ")}\` : \`${"★"
        .repeat(card.wear)
        .padEnd(5, "☆")}\` : \`${(`#` + card.serialNumber.toString(10)).padEnd(
        pad.issue,
        " "
      )}\` ` +
      (baseCard.group ? `**${baseCard.group}** ` : ``) +
      `${baseCard.name}`
    );
  }

  public static async getAllCards(): Promise<GameBaseCard[]> {
    return await CardGet.getAllCards();
  }

  /*
      UserCards
  */
  public static async createNewUserCard(
    card: GameBaseCard,
    profile: GameProfile,
    zephyr: Zephyr,
    price: number = 0,
    frame: number = 1
  ): Promise<GameUserCard> {
    return await CardSet.createNewUserCard(card, profile, zephyr, price, frame);
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
  public static async getLastCard(discordId: string): Promise<GameUserCard> {
    return await CardGet.getLastCard(discordId);
  }
  public static async getUserInventory(
    profile: GameProfile,
    options: Filter
  ): Promise<GameUserCard[]> {
    return await CardGet.getUserInventory(profile.discordId, options);
  }
  public static async getUserInventorySize(
    profile: GameProfile,
    options: Filter
  ): Promise<number> {
    return await CardGet.getUserInventorySize(profile.discordId, options);
  }
  public static async generateCardImage(
    card: GameUserCard | GameDroppedCard,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const baseCard = zephyr.getCard(card.baseCardId);

    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    let img = await loadImage(baseCard.image);
    const overlay = await loadImage(
      `./src/assets/groups/${baseCard.group?.toLowerCase() || "nogroup"}.png`
    );
    let frame: Image;
    if (!card.frameId || !card.frameUrl) {
      frame = await loadImage(`./src/assets/frames/frame-white.png`);
    } else frame = await loadImage(card.frameUrl);

    /*ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "#18700C";
    ctx.fill();

    ctx.drawImage(frame, 0, 0, 350, 500);
    ctx.restore();

    ctx.drawImage(frame, 0, 0, 350, 500);
    ctx.save();
    ctx.globalCompositeOperation = "destination-atop";
    ctx.fillStyle = "#18700C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();*/
    ctx.drawImage(img, 0, 0, 350, 500);
    ctx.drawImage(frame, 0, 0, 350, 500);
    ctx.drawImage(overlay, 0, 0, 350, 500);

    ctx.font = "20px AlteHaasGroteskBold";
    ctx.fillText(`#${card.serialNumber}`, 48, 422);
    ctx.font = "30px AlteHaasGroteskBold";
    ctx.fillText(`${baseCard.name}`, 47, 446);

    const buf = canvas.toBuffer("image/png");
    return Buffer.alloc(buf.length, buf, "base64");
  }

  public static async generateCardCollage(
    cards: GameUserCard[] | GameDroppedCard[],
    zephyr: Zephyr
  ): Promise<Buffer> {
    const canvas = createCanvas(cards.length * 250, 333);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, cards.length * 250, 333);
    ctx.fillStyle = "#36393E";
    ctx.fill();

    ctx.font = "14px AlteHaasGroteskBold";
    for (let [i, card] of cards.entries()) {
      const cardBuffer = await this.generateCardImage(card, zephyr);
      const img = await loadImage(cardBuffer);
      ctx.drawImage(img, i * 250, 0, 250, 333);
    }
    const buf = canvas.toBuffer("image/jpeg");
    return Buffer.alloc(buf.length, buf, "base64");
  }

  public static async changeCardFrame(
    card: GameUserCard,
    frameId: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const newCard = await CardSet.setCardFrame(card, frameId);
    return await this.updateCardCache(newCard, zephyr);
  }
  public static async getRandomFrame(
    includeUnshoppable: boolean = false
  ): Promise<GameFrame> {
    return await CardGet.getRandomFrame(includeUnshoppable);
  }
  public static async getFrameById(id: number): Promise<GameFrame> {
    return await CardGet.getFrameById(id);
  }

  public static async transferCardsToUser(
    cards: GameUserCard[],
    profile: GameProfile
  ): Promise<void> {
    return await CardSet.transferCardsToUser(cards, profile.discordId);
  }

  public static async dismantleCards(
    cards: GameUserCard[],
    zephyr: Zephyr
  ): Promise<void> {
    return await CardSet.dismantleCards(cards, zephyr.user.id);
  }

  /*
      Caching
  */
  public static async updateCardCache(
    card: GameUserCard,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const image = await this.generateCardImage(card, zephyr);
    try {
      await fs.mkdir(`./cache/cards/${card.baseCardId}`);
    } catch (e) {}
    await fs.writeFile(`./cache/cards/temp/${card.id}`, image);
    await fs.rename(
      `./cache/cards/temp/${card.id}`,
      `./cache/cards/${card.baseCardId}/${card.id}`
    );
    return await fs.readFile(`./cache/cards/${card.baseCardId}/${card.id}`);
  }
  public static async checkCacheForCard(
    card: GameUserCard,
    zephyr: Zephyr
  ): Promise<Buffer> {
    try {
      return await fs.readFile(`./cache/cards/${card.baseCardId}/${card.id}`);
    } catch (e) {
      return await this.updateCardCache(card, zephyr);
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
}
