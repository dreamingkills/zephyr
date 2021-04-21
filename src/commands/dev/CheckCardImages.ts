import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import fs from "fs/promises";
import { Logger } from "../../lib/logger/Logger";

export default class CheckCardImages extends BaseCommand {
  names = ["cci"];
  description = `Scans card images for errors.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const images = this.zephyr.getCards().map((c) => c.image);

    const failed = [];
    for (let i of images) {
      try {
        await fs.readFile(i);
      } catch {
        failed.push(i);
      }
    }

    const embed = new MessageEmbed(`Check Card Images`, msg.author);

    if (failed.length === 0) {
      embed.setDescription(`:ok_hand: All files were scanned successfully.`);
    } else {
      embed.setDescription(
        `**${failed.length}** file${
          failed.length === 1 ? `` : `s`
        } failed. See console for further information.`
      );

      Logger.warn(failed);
    }

    await this.send(msg.channel, embed);
    return;
  }
}
