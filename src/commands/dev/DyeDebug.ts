import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { createCanvas, loadImage } from "canvas";
import gm from "gm";

export default class DyeDebug extends BaseCommand {
  names = ["dyedebug", "ddg"];
  description = `Developer command.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const [r, g, b] = [
      parseInt(options[0]),
      parseInt(options[1]),
      parseInt(options[2]),
    ];

    const baseCard = this.zephyr.getCard(1);
    const canvas = createCanvas(350, 500);
    const ctx = canvas.getContext("2d");

    let img = await loadImage(baseCard.image);
    const overlay = await loadImage(
      `./src/assets/groups/${
        baseCard.group?.toLowerCase().replace("*", "") || "nogroup"
      }.png`
    );
    let frame = await loadImage(
      `./src/assets/frames/default/frame-default.png`
    );

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

    const ooga = gm(`./src/assets/frames/default/mask-default.png`).colorize(
      r,
      g,
      b
    );
    ooga.toBuffer("PNG", async (e, b) => {
      if (e) throw e;
      const img = await loadImage(b);
      ctx.drawImage(img, 0, 0, 350, 500);

      ctx.drawImage(overlay, 0, 0, 350, 500);

      ctx.font = "20px AlteHaasGroteskBold";
      ctx.fillText(`#1`, 50, 424);
      ctx.font = "30px AlteHaasGroteskBold";
      ctx.fillText(`HeeJin`, 50, 448);

      const buf = canvas.toBuffer("image/png");
      const final = Buffer.alloc(buf.length, buf, "base64");

      await msg.channel.createMessage("ooga", {
        file: final,
        name: "dev.png",
      });
    });
  }
}
