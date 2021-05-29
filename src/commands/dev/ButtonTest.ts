import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";

export default class ButtonTest extends BaseCommand {
  names = ["buttontest"];
  description = `Button Test.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await msg.channel.createMessage({
      components: [
        { type: 1, components: [{ type: 2, custom_id: `test`, style: 1 }] },
      ],
    });
  }
}
