import { Message } from "eris";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";

export default class SetMaintenanceMode extends BaseCommand {
  names = [`setmaintenancemode`, `smm`, `maint`];
  description = `Toggles maintenance mode.`;
  usage = [`$CMD$`];
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    Zephyr.maintenance.enabled = !Zephyr.maintenance.enabled;

    await this.send(
      msg.channel,
      `Maintenance mode is now **${
        Zephyr.maintenance.enabled ? `enabled` : `disabled`
      }**.`
    );
    return;
  }
}
