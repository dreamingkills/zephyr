import { Message } from "eris";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class SetMaintenanceMessage extends BaseCommand {
  names = [`setmaintenancemessage`, `smmsg`];
  description = `Changes the maintenance message.`;
  usage = [`$CMD$ <message>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    Zephyr.maintenance.message =
      options.join(` `) || `No maintenance message has been specified.`;

    await this.send(
      msg.channel,
      `Updated the maintenance message to ${options.join(` `)}`
    );
    return;
  }
}
