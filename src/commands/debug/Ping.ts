import { Message } from "discord.js";
import { BaseCommand } from "../../structures/command/Command";

export default class Ping extends BaseCommand {
  names = ["ping"];
  description = "Hello.";

  async exec(msg: Message): Promise<void> {
    await msg.channel.send("Hi.");
  }
}
