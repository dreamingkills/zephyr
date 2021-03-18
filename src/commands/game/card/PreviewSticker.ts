import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { createCanvas, loadImage } from "canvas";

export default class PreviewSticker extends BaseCommand {
  id = `dirt`;
  names = [`previewsticker`, `ps`];
  description = `Shows you what a sticker looks like before you buy it.`;
  usage = [`$CMD$ <sticker>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const query = options.join(" ").toLowerCase();
    if (!query) throw new ZephyrError.InvalidStickerError();

    const sticker = this.zephyr.getStickerByName(
      query.toLowerCase().replace("sticker", "").trim()
    );
    if (!sticker) throw new ZephyrError.InvalidStickerError();

    const canvas = createCanvas(120, 120);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, 120, 120);
    ctx.fillStyle = "#36393E";
    ctx.fill();

    const stickerImg = await loadImage(sticker.imageUrl);
    ctx.drawImage(stickerImg, 0, 0, 120, 120);

    const buffer = canvas.toBuffer("image/jpeg");

    await this.send(
      msg.channel,
      `> **${msg.author.tag}** — Previewing **${sticker.name}**`,
      { file: { file: buffer, name: `sticker.png` } }
    );
    return;
  }
}
