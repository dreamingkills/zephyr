import { Message } from "eris";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class DisableCommand extends BaseCommand {
  names = [`disable`];
  description = `Toggles a command's disabled property.`;
  usage = [`$CMD$ <command>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) {
      await this.send(msg.channel, `Invalid command or alias.`);

      return;
    }

    const command = Zephyr.commandLib.getCommand(options[0].toLowerCase());

    if (!command) {
      await this.send(msg.channel, `Invalid command or alias.`);

      return;
    }

    command.disabled = !command.disabled;

    await this.send(
      msg.channel,
      `Command \`${command.names[0]}\` (ID \`${command.id}\`) is now **${
        command.disabled ? `disabled` : `enabled`
      }**.`
    );
    return;
  }
}
