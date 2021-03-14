import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import emoji from "node-emoji";
import { GameTag } from "../../../structures/game/Tag";

export default class EditTag extends BaseCommand {
  id = `freeze`;
  names = [`edittag`, `et`];
  description = `Changes the name or emoji of an existing tag.`;
  usage = [
    `$CMD$ <tag name> <new name>`,
    `$CMD$ <tag name> <new emoji>`,
    `$CMD$ <tag name> <new name> <new emoji>`,
  ];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedTagError();

    const tags = await ProfileService.getTags(profile);

    if (tags.length === 0) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.NoTagsError(prefix);
    }

    const tagName = options[0]?.toLowerCase();
    const hasTag = tags.filter((t) => t.name === tagName)[0];

    if (!hasTag) throw new ZephyrError.TagNotFoundError(options[0]);

    const newParameter = options[1]?.toLowerCase();
    const newEmoji = options[2]?.toLowerCase();

    let newTag: GameTag;

    if (newEmoji) {
      if (newParameter.length > 12)
        throw new ZephyrError.UnspecifiedTagInCreationError();

      const isEmoji = emoji.find(newEmoji);
      if (!isEmoji) throw new ZephyrError.InvalidEmojiTagError();

      if (tags.find((t) => t.name === newParameter))
        throw new ZephyrError.DuplicateTagError(newParameter);

      if (tags.find((t) => t.emoji === isEmoji.emoji))
        throw new ZephyrError.DuplicateTagEmojiError(isEmoji.emoji);

      newTag = await ProfileService.editTag(hasTag, newParameter, newEmoji);
    } else {
      if (!newParameter || newParameter.length > 12)
        throw new ZephyrError.UnspecifiedTagInCreationError();

      const isEmoji = emoji.find(newParameter);

      if (isEmoji) {
        if (tags.find((t) => t.emoji === isEmoji.emoji))
          throw new ZephyrError.DuplicateTagEmojiError(isEmoji.emoji);

        newTag = await ProfileService.editTag(hasTag, undefined, isEmoji.emoji);
      } else {
        if (tags.find((t) => t.name === newParameter))
          throw new ZephyrError.DuplicateTagError(newParameter);

        newTag = await ProfileService.editTag(hasTag, newParameter);
      }
    }

    const embed = new MessageEmbed(`Edit Tag`, msg.author).setDescription(
      `Edited tag ${hasTag.emoji} **${hasTag.name}** to ${newTag.emoji} **${newTag.name}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
