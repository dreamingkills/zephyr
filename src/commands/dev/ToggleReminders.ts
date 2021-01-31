import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class ToggleReminders extends BaseCommand {
  names = ["togglereminders"];
  description = `Toggles reminders being enabled/disabled.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    this.zephyr.dmHandler.remindersEnabled = !this.zephyr.dmHandler
      .remindersEnabled;

    const embed = new MessageEmbed(
      `Toggle Reminders`,
      msg.author
    ).setDescription(
      `Reminders have been ${
        this.zephyr.dmHandler.remindersEnabled ? `enabled` : `disabled`
      }.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
