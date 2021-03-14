import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import emoji from "node-emoji";

export default class CreateTag extends BaseCommand {
  names = [`createtag`, `ct`];
  description = `Creates a tag which you can add to your cards.`;
  usage = [`$CMD$ <tag name> <emoji>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedTagInCreationError();
    if (!options[1]) throw new ZephyrError.InvalidEmojiTagError();

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

    const tagName = options[0].toLowerCase();

    if (tagName.length > 12)
      throw new ZephyrError.UnspecifiedTagInCreationError();

    if (userTags.find((t) => t.name === tagName))
      throw new ZephyrError.DuplicateTagError(tagName);

    const emojiRaw = options[1];
    const trueEmoji = emoji.find(emojiRaw);

    if (!trueEmoji) throw new ZephyrError.InvalidEmojiTagError();

    if (userTags.find((t) => t.emoji.includes(trueEmoji.emoji)))
      throw new ZephyrError.DuplicateTagEmojiError(trueEmoji.emoji);

    const tag = await ProfileService.createTag(
      profile,
      tagName,
      trueEmoji.emoji
    );

    const prefix = this.zephyr.getPrefix(msg.guildID);
    const embed = new MessageEmbed(`Create Tag`, msg.author).setDescription(
      `The tag ${tag.emoji} **${tag.name}** has been created.\nTag your cards by using \`${prefix}tc <cards>\`!`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
