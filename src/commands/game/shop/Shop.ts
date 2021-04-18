import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";

export default class Shop extends BaseCommand {
  id = `dreamer`;
  names = [`shop`];
  description = `The shop has been split into two different commands! This command will show you where to find them.`;
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const prefix = this.zephyr.getPrefix(msg.guildID);

    const embed = new MessageEmbed(`Shop`, msg.author).setDescription(
      `**The shops have moved to new locations!**\n— You can use \`${prefix}stickershop\` to view the sticker shop.\n— You can use \`${prefix}itemshop\` to view the item shop.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
