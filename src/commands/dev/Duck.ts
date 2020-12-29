import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";

export default class Duck extends BaseCommand {
  names = ["duck"];
  description = `Maybe you meant !duc.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await msg.channel.createMessage(":duck: Quack.");
    return;
  }
}
