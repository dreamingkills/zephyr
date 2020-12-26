import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class Reminders extends BaseCommand {
  names = ["reminders", "rm"];
  description = "Shows your active reminders.";
  usage = ["$CMD$ [type]"];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const subcommand = this.options[0]?.toLowerCase();
    if (subcommand) {
      let message;
      if (["drop", "drops", "d"].indexOf(subcommand) > -1) {
        await ProfileService.toggleDropReminders([profile]);
        if (profile.dropReminder) {
          message = "You have disabled drop reminders.";
        } else message = "You have enabled drop reminders.";
      } else if (["claim", "claims", "c"].indexOf(subcommand) > -1) {
        await ProfileService.toggleClaimReminders([profile]);
        if (profile.claimReminder) {
          message = "You have disabled claim reminders.";
        } else message = "You have enabled claim reminders.";
      } else throw new ZephyrError.InvalidReminderTypeError();

      const embed = new MessageEmbed()
        .setAuthor(
          `Reminders | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(message);
      await msg.channel.createMessage({ embed });
      return;
    }
    const embed = new MessageEmbed()
      .setAuthor(
        `Reminders | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${msg.author.tag}'s reminders`)
      .setDescription(
        `— Drops: **${profile.dropReminder ? `ON` : `OFF`}**` +
          `\n— Claims: **${profile.claimReminder ? `ON` : `OFF`}**`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
