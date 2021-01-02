import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { CardService } from "../../lib/database/services/game/CardService";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { createCanvas, loadImage } from "canvas";

export default class ForceSticker extends BaseCommand {
  names = ["forcesticker"];
  description = `Forcibly puts a sticker on a card.`;
  usage = ["$CMD$ <card> <sticker> <x> <y> <rot>"];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const identifier = options[0];
    if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

    const card = await CardService.getUserCardByIdentifier(identifier);
    const image = await CardService.checkCacheForCard(card, this.zephyr);

    const position = parseInt(options[2]) - 1;
    const posX = 82 + (position - Math.floor(position / 4) * 4) * 62;
    const posY = 90 + Math.floor(position / 4) * 68;
    // const rot = parseInt(options[3]);

    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    const cardImage = await loadImage(image);
    ctx.drawImage(cardImage, 0, 0);
    const overlay = await loadImage(`./src/assets/stickers/overlay.png`);
    ctx.drawImage(overlay, 0, 0, 350, 500);
    const sticker = await loadImage(`./src/assets/stickers/sparkles.png`);

    ctx.save();

    ctx.translate(posX, posY);
    // ctx.rotate((Math.PI / 180) * rot);

    ctx.drawImage(sticker, -64 / 2, -64 / 2, 64, 64);

    ctx.restore();

    const buf = canvas.toBuffer("image/png");
    const final = Buffer.alloc(buf.length, buf, "base64");

    await msg.channel.createMessage("ooga", { file: final, name: "test.png" });
  }
}
