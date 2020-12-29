import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Base36ToInt extends BaseCommand {
  names = ["b36ti"];
  description = "Developer command";
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const num = parseInt(options[0], 36);
    await msg.channel.createMessage(`${options[0]} -> ${num}`);
    return;
  }
}
