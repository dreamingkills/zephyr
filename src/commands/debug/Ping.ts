import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class Ping extends BaseCommand {
  id = `mayhem`;
  names = [`ping`];
  description = `ping`;
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const responseTime = Date.now() - msg.createdAt;
    const embed = new MessageEmbed(`Ping`, msg.author).setDescription(
      `:satellite: Response time: ${responseTime}ms (inaccurate)`
    );

    await msg.channel.createMessage({
      embed,
      components: [
        {
          type: 1,
          components: [
            { type: 2, custom_id: `test`, style: 1, label: `Hello World!` },
          ],
        },
      ],
    });

    return;
  }
}
