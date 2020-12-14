import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class DeleteTag extends BaseCommand {
  names = ["deletetag", "dt"];
  description = "Deletes a tag.";
  usage = ["$CMD$ <tag name>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const userTags = await ProfileService.getTags(profile);

    const tagQuery = this.options[0]?.toLowerCase();
    const hasTag = userTags.filter((t) => t.name === tagQuery)[0];

    if (!hasTag) throw new ZephyrError.InvalidTagError();

    await ProfileService.deleteTag(hasTag);

    const embed = new MessageEmbed()
      .setAuthor(
        `Delete Tag | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(`Deleted tag ${hasTag.emoji} \`${hasTag.name}\`.`);
    await msg.channel.createMessage({ embed });
    return;
  }
}
