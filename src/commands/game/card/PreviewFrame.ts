import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { createCanvas, loadImage } from "canvas";

export default class PreviewFrame extends BaseCommand {
  names = ["previewframe", "pf"];
  description = "Shows you what a frame looks like before you buy it.";
  usage = ["$CMD$ <frame>"];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const query = options.join(" ").toLowerCase();
    if (!query) throw new ZephyrError.NoFrameSpecifiedError();
    const frame = await ShopService.getFrameByName(query);

    const canvas = createCanvas(385, 550);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, 385, 550);
    ctx.fillStyle = "#36393E";
    ctx.fill();

    const frameImg = await loadImage(frame.frameUrl);
    ctx.drawImage(frameImg, 0, 0, 385, 550);

    const buffer = canvas.toBuffer("image/jpeg");
    const final = Buffer.alloc(buffer.length, buffer, "base64");

    await this.send(
      msg.channel,
      `> **${msg.author.tag}** — Previewing **${frame.frameName} Frame**`,
      { file: { file: final, name: `frame.png` } }
    );
    return;
  }
}
