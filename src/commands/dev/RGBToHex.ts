import { Message } from "eris";
import { rgbToHex } from "../../lib/ZephyrUtils";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class RGBToHex extends BaseCommand {
  names = ["rgbth"];
  description = `Converts RGB to hexadecimal.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[],
    _isDm: boolean
  ): Promise<void> {
    const r = parseInt(options[0]);
    const g = parseInt(options[1]);
    const b = parseInt(options[2]);
    await msg.channel.createMessage(rgbToHex(r, g, b));
    return;
  }
}
