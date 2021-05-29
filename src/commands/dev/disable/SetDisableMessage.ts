import { Message } from "eris";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class SetDisableMessage extends BaseCommand {
  names = [`setdisablemessage`, `sdm`];
  description = `Sets a command's disable message.`;
  usage = [`$CMD$ <message>`];
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

    command.disabledMessage = options.slice(1).join(` `);

    await this.send(
      msg.channel,
      `Command \`${command.names[0]}\` (ID \`${command.id}\`)'s disabled message was updated to ${command.disabledMessage}`
    );
    return;
  }
}
