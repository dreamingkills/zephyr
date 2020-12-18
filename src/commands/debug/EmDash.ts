import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class EmDash extends BaseCommand {
  names = ["em"];
  description = "Sends an em dash for convenience.";
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    await msg.channel.createMessage("Here's your em dash: `—`");
  }
}
