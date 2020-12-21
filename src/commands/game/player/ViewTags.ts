import { Message, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class ViewTags extends BaseCommand {
  names = ["viewtags", "tags", "vt"];
  description = "Shows you a list of your tags.";
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ <id>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile | undefined;
    let targetUser: User | undefined;

    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (!isNaN(parseInt(this.options[0]))) {
      if (this.options[0].length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(this.options[0]);
    } else {
      targetUser = msg.author;
      target = profile;
    }

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    if (!target) target = await ProfileService.getProfile(targetUser.id);
    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const userTags = await ProfileService.getTags(target);

    const embed = new MessageEmbed()
      .setAuthor(
        `Tag List | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${targetUser.tag}'s tags`)
      .setDescription(
        userTags.length === 0
          ? `You have no tags.`
          : `${userTags
              .map((t) => {
                return `${t.emoji} — \`${t.name}\``;
              })
              .join("\n")}`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
