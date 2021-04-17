import { Message } from "eris";
import { Stickers } from "../../lib/cosmetics/Stickers";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class RefreshStickers extends BaseCommand {
  names = [`refreshstickers`];
  description = `Reloads all stickers.`;
  developerOnly = true;
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    await Stickers.loadStickers();

    const embed = new MessageEmbed(
      `Refresh Stickers`,
      msg.author
    ).setDescription(
      `:white_check_mark: Successfully refreshed the sticker cache.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
