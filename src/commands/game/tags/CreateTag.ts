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
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (options.length > 2) throw new ZephyrError.TagContainsSpacesError();

    const userTags = await ProfileService.getTags(profile);
    if (
      (userTags.length >= 10 && profile.patron === 0) ||
      (userTags.length >= 15 && profile.patron === 1) ||
      (userTags.length >= 25 && profile.patron === 2) ||
      (userTags.length >= 40 && profile.patron === 3) ||
      (userTags.length >= 75 && profile.patron === 4)
    ) {
      const prefix = this.zephyr.getPrefix(msg.guildID!);
      throw new ZephyrError.TagsFullError(profile.patron, prefix);
    }

    const tag = options[0]?.toLowerCase();
    if (!tag || tag.length > 12)
      throw new ZephyrError.UnspecifiedTagInCreationError();

    if (userTags.filter((t) => t.name === tag)[0])
      throw new ZephyrError.DuplicateTagError(tag);

    const emojiRaw = options[1];
    const trueEmoji = emojiregex().exec(emojiRaw);
    if (!trueEmoji || emojiRaw.length > 2)
      throw new ZephyrError.InvalidEmojiTagError();

    if (userTags.filter((t) => t.emoji === trueEmoji[0])[0])
      throw new ZephyrError.DuplicateTagEmojiError(trueEmoji[0]);

    await ProfileService.createTag(profile, tag, trueEmoji[0]);
    const embed = new MessageEmbed(`Create Tag`, msg.author).setDescription(
      `Created tag ${trueEmoji[0]} \`${tag}\`!`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
