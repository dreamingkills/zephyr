import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class IntToBase36 extends BaseCommand {
  names = ["itb36"];
  description = "Developer command";
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const num = parseInt(options[0], 10);
    await this.send(msg.channel, `${num} -> ${num.toString(36)}`);
    return;
  }
}
