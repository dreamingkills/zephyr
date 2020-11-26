import { createCanvas, loadImage, Image } from "canvas";
import { GameBaseCard } from "../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { Filter } from "../../sql/Filters";
import { CardGet } from "../../sql/game/card/CardGet";
import fs from "fs/promises";
import { CardSet } from "../../sql/game/card/CardSet";
import { Zephyr } from "../../../../structures/client/Zephyr";

export interface CardReference {
  identifier: string;
  serialNumber: number;
}

export abstract class CardService {
  public static parseReference(card: GameUserCard, base: GameBaseCard): string {
    return `${base.identifier}#${card.serialNumber}`;
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
    tier?: number
  ): Promise<GameUserCard> {
    return await CardSet.createNewUserCard(card, profile, zephyr, price, tier);
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
    const canvas = createCanvas(700, 1000);
    const ctx = canvas.getContext("2d");

    const dir = `./src/assets/cards/${card.baseCardId}`;
    let img: Image;
    switch (card.tier) {
      case 2: {
        img = await loadImage(`${dir}/two.png`);
        break;
      }
      case 3: {
        img = await loadImage(`${dir}/three.png`);
        break;
      }
      case 4: {
        img = await loadImage(`${dir}/four.png`);
        break;
      }
      case 5: {
        img = await loadImage(`${dir}/five.png`);
        break;
      }
      case 6: {
        img = await loadImage(`${dir}/six.png`);
        break;
      }
      default: {
        img = await loadImage(`${dir}/one.png`);
        break;
      }
    }
    const overlay = await loadImage(`${dir}/overlay.png`);
    const frame = await loadImage(`./src/assets/frames/${card.frame}.png`);

    ctx.drawImage(img, 0, 0, 700, 1000);
    ctx.drawImage(frame, 0, 0, 700, 1000);
    ctx.drawImage(overlay, 0, 0, 700, 1000);

    ctx.font = "35px AlteHaasGroteskBold";
    ctx.fillText(`#${card.serialNumber}`, 75, 878);

    const buf = canvas.toBuffer("image/png");
    return Buffer.alloc(buf.length, buf, "base64");
  }
  public static async generateCardCollage(
    cards: GameUserCard[]
  ): Promise<Buffer> {
    const canvas = createCanvas(cards.length * 250, 333);
    const ctx = canvas.getContext("2d");

    ctx.font = "14px AlteHaasGroteskBold";
    for (let card of cards) {
      const image = await loadImage(
        `./src/assets/cards/${card.baseCardId}/example_${card.tier}.png`
      );
      ctx.drawImage(image, cards.indexOf(card) * 250, 0, 250, 333);
      ctx.fillText(
        `#${card.serialNumber}`,
        cards.indexOf(card) * 250 + 26,
        293
      );
    }
    const buf = canvas.toBuffer("image/png");
    return Buffer.alloc(buf.length, buf, "base64");
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
