import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class IntToBase36 extends BaseCommand {
  names = ["itb36"];
  description = "Developer command";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const num = parseInt(this.options[0], 10);
    const base36 = num.toString(36);
    await msg.channel.createMessage(`${this.options[0]} -> ${base36}`);
  }
}
