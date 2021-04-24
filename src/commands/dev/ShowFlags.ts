import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { Zephyr } from "../../structures/client/Zephyr";

export default class Flags extends BaseCommand {
  names = [`flags`];
  description = `Shows the list of flags and their values.`;
  usage = [`$CMD$`];
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const flags = Object.entries(Zephyr.flags);

    const flagValues = [];

    for (let flag of flags) {
      flagValues.push(`**${flag[0]}**: ${flag[1]}`);
    }

    const embed = new MessageEmbed(`Flags`, msg.author)
      .setTitle(`Flag list`)
      .setDescription(flagValues.join(`\n`));

    await this.send(msg.channel, embed);
    return;
  }
}
