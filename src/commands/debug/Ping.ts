import { Message } from "discord.js";
import { Command } from "../../structures/command/Command";

export default class Ping extends Command {
  names = ["ping"];
  description = "Hello.";

  async exec(msg: Message): Promise<void> {
    await msg.channel.send("Hi.");
  }
}
