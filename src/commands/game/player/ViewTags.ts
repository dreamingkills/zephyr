import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class ViewTags extends BaseCommand {
  names = ["viewtags", "tags", "vt"];
  description = "Shows you a list of your tags.";
  usage = ["$CMD$"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const userTags = await ProfileService.getTags(profile);

    const embed = new MessageEmbed()
      .setAuthor(
        `Tag List | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
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
