import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";

export default class EmDash extends BaseCommand {
  names = ["em"];
  description = "Sends an em dash for convenience.";
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await this.send(msg.channel, "Here's your em dash: `—`");
    return;
  }
}
