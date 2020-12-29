import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { getNearestColor } from "../../lib/ZephyrUtils";

export default class ColorProximity extends BaseCommand {
  names = ["cprox"];
  description = `Finds closest color.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const nearest = getNearestColor(options[0]);
    await msg.channel.createMessage(
      `Nearest Match:\n— ${nearest.name}\n— ${nearest.value} (${nearest.distance})`
    );
  }
}
