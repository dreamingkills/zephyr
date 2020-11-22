import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Ping extends BaseCommand {
  names = ["ping"];
  description = "Hello.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    await msg.channel.createMessage(`You are: ${profile.discordId}`);
  }
}
