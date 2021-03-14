import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class DeleteTag extends BaseCommand {
  id = `acdc`;
  names = [`deletetag`, `dt`];
  description = `Deletes a tag and removes it from all of your cards.`;
  usage = [`$CMD$ <tag name>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedTagError();

    const userTags = await ProfileService.getTags(profile);

    const tagName = options[0].toLowerCase();
    const tag = userTags.find((t) => t.name === tagName);

    if (!tag) throw new ZephyrError.TagNotFoundError(tagName);

    await ProfileService.deleteTag(tag);

    const embed = new MessageEmbed(`Delete Tag`, msg.author).setDescription(
      `The tag ${tag.emoji} **${tag.name}** was deleted.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
