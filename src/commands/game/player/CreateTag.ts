import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import emojiregex from "emoji-regex";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class CreateTag extends BaseCommand {
  names = ["createtag", "ct"];
  description = "Creates a tag for use.";
  usage = ["$CMD$ <tag name> <emoji>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const userTags = await ProfileService.getTags(profile);
    if (
      (userTags.length >= 3 && profile.patron === 0) ||
      (userTags.length >= 5 && profile.patron === 1) ||
      (userTags.length >= 7 && profile.patron === 2) ||
      (userTags.length >= 10 && profile.patron === 3) ||
      (userTags.length >= 15 && profile.patron === 4)
    ) {
      const prefix = this.zephyr.getPrefix(msg.guildID!);
      throw new ZephyrError.TagsFullError(profile.patron, prefix);
    }

    const tag = this.options[0]?.toLowerCase();
    if (!tag || tag.length > 6)
      throw new ZephyrError.UnspecifiedTagInCreationError();

    if (userTags.filter((t) => t.name === tag)[0])
      throw new ZephyrError.DuplicateTagError();

    const emojiRaw = this.options[1];
    const trueEmoji = emojiregex().exec(emojiRaw);
    if (!trueEmoji) throw new ZephyrError.InvalidEmojiTagError();

    await ProfileService.createTag(profile, tag, trueEmoji[0]);
    const embed = new MessageEmbed()
      .setAuthor(
        `Tag Creator | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(`Created tag **${tag}** with emoji ${trueEmoji[0]}!`);
    await msg.channel.createMessage({ embed });
    return;
  }
}
