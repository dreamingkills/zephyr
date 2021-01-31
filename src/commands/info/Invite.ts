import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class Invite extends BaseCommand {
  names = ["invite", "support"];
  description =
    "Sends a link to the Zephyr Community server, and a link to add the bot.";
  usage = ["$CMD$"];
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const embed = new MessageEmbed(`Invite`, msg.author).setDescription(
      `You can add the bot to your server by [clicking here](https://discord.com/api/oauth2/authorize?client_id=791100707629432863&permissions=388160&scope=bot)!` +
        `\nYou can also join the Zephyr Community server at https://discord.gg/7PFyqUvKYs.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
