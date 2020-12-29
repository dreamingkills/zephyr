import { Message } from "eris";
import { hexToRgb } from "../../lib/ZephyrUtils";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class HexToRGB extends BaseCommand {
  names = ["htrgb"];
  description = `Converts hexadecimal to RGB.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const hex = options[0];
    const rgb = hexToRgb(hex);

    await msg.channel.createMessage(`R: ${rgb.r}\nG: ${rgb.g}\nB: ${rgb.b}`);
    return;
  }
}
