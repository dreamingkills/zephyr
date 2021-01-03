import { Message } from "eris";
import { createMessage } from "../../lib/discord/message/createMessage";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class Ping extends BaseCommand {
  names = ["ping"];
  description = "Hello.";
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const responseTime = Date.now() - msg.createdAt;
    const embed = new MessageEmbed("Ping", msg.author).setDescription(
      `:satellite: Response time: ${responseTime}ms (inaccurate)`
    );
    await createMessage(msg.channel, embed);
    return;
  }
}
