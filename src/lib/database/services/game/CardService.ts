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

export interface CardReference {
  identifier: string;
  serialNumber: number;
}

export abstract class CardService {
  public static parseReference(card: GameUserCard): string {
    return `${card.identifier}#${card.serialNumber}`;
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
  public static async getUserCardByReference(
    ref: CardReference
  ): Promise<GameUserCard> {
    return await CardGet.getUserCardByReference(ref);
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
  public static async generateCardImage(card: GameUserCard): Promise<Buffer> {
    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    const dir = `./src/assets/cards/${card.baseCardId}`;
    let img = await loadImage(`${dir}/one.png`);
    const overlay = await loadImage(`${dir}/overlay.png`);
    let frame: Image;
    if (!card.frameId || !card.frameUrl) {
      frame = await loadImage(`./src/assets/frames/frame-white.png`);
    } else frame = await loadImage(card.frameUrl);

    ctx.drawImage(img, 0, 0, 350, 500);
    ctx.drawImage(frame, 0, 0, 350, 500);
    ctx.drawImage(overlay, 0, 0, 350, 500);

    ctx.font = "20px AlteHaasGroteskBold";
    ctx.fillText(`#${card.serialNumber}`, 48, 422);

    const buf = canvas.toBuffer("image/png");
    return Buffer.alloc(buf.length, buf, "base64");
  }
  public static async generateCardCollege(
    cards: GameDroppedCard[]
  ): Promise<Buffer> {
    const canvas = createCanvas(cards.length * 250, 333);
    const ctx = canvas.getContext("2d");

    const baseUrl = `./src/assets/cards/`;
    ctx.font = "14px AlteHaasGroteskBold";
    for (let card of cards) {
      const base = await loadImage(`${baseUrl}${card.id}/one.png`);
      const overlay = await loadImage(`${baseUrl}${card.id}/overlay.png`);
      const getFrame = await this.getFrameById(card.frameId);
      const frame = await loadImage(getFrame.frameUrl);
      ctx.drawImage(base, cards.indexOf(card) * 250, 0, 250, 333);
      ctx.drawImage(frame, cards.indexOf(card) * 250, 0, 250, 333);
      ctx.drawImage(overlay, cards.indexOf(card) * 250, 0, 250, 333);
      ctx.fillText(
        `#${card.serialNumber}`,
        cards.indexOf(card) * 250 + 35,
        281
      );
    }
    const buf = canvas.toBuffer("image/png");
    return Buffer.alloc(buf.length, buf, "base64");
  }
  public static async changeCardFrame(
    card: GameUserCard,
    frameId: number
  ): Promise<Buffer> {
    const newCard = await CardSet.setCardFrame(card, frameId);
    return await this.updateCardCache(newCard);
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

  /*
      Caching
  */
  public static async updateCardCache(card: GameUserCard): Promise<Buffer> {
    const image = await this.generateCardImage(card);
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
  public static async checkCacheForCard(card: GameUserCard): Promise<Buffer> {
    try {
      return await fs.readFile(`./cache/cards/${card.baseCardId}/${card.id}`);
    } catch (e) {
      return await this.updateCardCache(card);
    }
  }
}
