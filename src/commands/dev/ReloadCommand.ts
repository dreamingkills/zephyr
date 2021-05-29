import { Message } from "eris";
import { Zephyr } from "../../structures/client/Zephyr";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class ReloadCommand extends BaseCommand {
  names = [`reloadcommand`, `rcmd`];
  description = `Re-imports a command.`;
  developerOnly = true;
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const commandLib = Zephyr.commandLib;

    if (!options[0]) {
      await this.send(msg.channel, `Invalid command name or alias.`);
      return;
    }

    const command = commandLib.getCommand(options[0].toLowerCase());

    if (!command) {
      await this.send(msg.channel, `Invalid command name or alias.`);
      return;
    }

    commandLib.reloadCommand(command);

    await this.send(msg.channel, `Command reloaded successfully.`);
    return;
  }
}
