import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Base36ToInt extends BaseCommand {
  names = ["b36ti"];
  description = "Developer command";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const num = parseInt(this.options[0], 36);
    await msg.channel.createMessage(`${this.options[0]} -> ${num}`);
  }
}
