import { Message } from "eris";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class SetMaintenanceHeader extends BaseCommand {
  names = [`setmaintenanceheader`, `smh`];
  description = `Changes the maintenance header.`;
  usage = [`$CMD$ <header>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    Zephyr.maintenance.header = options.join(` `) || `Maintenance.`;

    await this.send(
      msg.channel,
      `Updated the maintenance header to ${options.join(` `)}`
    );
    return;
  }
}
