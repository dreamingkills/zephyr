import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class ToggleDrops extends BaseCommand {
  names = ["toggledrops"];
  description = `Toggles drops being enabled/disabled.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    this.zephyr.dropsEnabled = !this.zephyr.dropsEnabled;
    const embed = new MessageEmbed()
      .setAuthor(
        `Toggle Drops | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Drops have been ${this.zephyr.dropsEnabled ? `enabled` : `disabled`}.`
      );

    await this.send(msg.channel, embed);
    return;
  }
}
