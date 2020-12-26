import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import emojiregex from "emoji-regex";

export default class EditTag extends BaseCommand {
  names = ["edittag", "et"];
  description = "Edits a tag.";
  usage = [
    "$CMD$ <tag name> <new name>",
    "$CMD$ <tag name> <new emoji>",
    "$CMD$ <tag name> <new name> <new emoji>",
  ];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const userTags = await ProfileService.getTags(profile);

    const tagQuery = this.options[0]?.toLowerCase();
    const hasTag = userTags.filter((t) => t.name === tagQuery)[0];

    if (!hasTag) throw new ZephyrError.InvalidTagError(this.options[0]);

    const firstParam = this.options[1]?.toLowerCase();
    const secondParam = this.options[2]?.toLowerCase();
    if (secondParam) {
      if (firstParam.length > 12)
        throw new ZephyrError.UnspecifiedTagInCreationError();
      const isEmoji = emojiregex().exec(secondParam);
      if (!isEmoji) throw new ZephyrError.InvalidEmojiTagError();

      if (userTags.filter((t) => t.name === firstParam)[0])
        throw new ZephyrError.DuplicateTagError(firstParam);

      await ProfileService.editTag(hasTag, firstParam, secondParam);
    } else {
      if (!firstParam || firstParam.length > 12)
        throw new ZephyrError.UnspecifiedTagInCreationError();
      const isEmoji = emojiregex().exec(firstParam);
      if (isEmoji) {
        await ProfileService.editTag(hasTag, undefined, isEmoji[0]);
      } else {
        if (userTags.filter((t) => t.name === firstParam)[0])
          throw new ZephyrError.DuplicateTagEmojiError(secondParam);

        await ProfileService.editTag(hasTag, firstParam);
      }
    }
    const newTag = await ProfileService.getTagById(hasTag.id);

    const embed = new MessageEmbed()
      .setAuthor(
        `Edit Tag | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Edited tag ${hasTag.emoji} **${hasTag.name}** to ${newTag.emoji} **${newTag.name}**.`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
