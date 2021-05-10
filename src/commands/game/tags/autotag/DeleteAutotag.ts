import { Message } from "eris";
import { AutotagService } from "../../../../lib/database/services/game/AutotagService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { Logger } from "../../../../lib/logger/Logger";
import {
  getConditionString,
  getGroupsByIdolId,
} from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { BaseCommand } from "../../../../structures/command/Command";
import { AutotagError } from "../../../../structures/error/AutotagError";
import { GameProfile } from "../../../../structures/game/Profile";

export default class DeleteAutotag extends BaseCommand {
  id = `zephyr`;
  names = [`deleteautotag`, `dat`];
  description = `Deletes an autotag constraint.`;
  usage = [`$CMD$ <autotag priority>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const priority = parseInt(options[0], 10);

    if (isNaN(priority) || priority < 1 || priority > 256)
      throw new AutotagError.InvalidPriorityError();

    const autotags = await AutotagService.getAutotags(profile);

    const targetAutotag = autotags.find((at) => at.priority === priority);

    if (!targetAutotag) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      throw new AutotagError.PriorityNotFoundError(prefix);
    }

    const tags = await ProfileService.getTags(profile);

    const targetTag = tags.find((t) => t.id === targetAutotag.tagId);

    if (!targetTag) {
      Logger.error(
        `Attempt to delete Autotag ID ${targetAutotag.id} failed - missing tag (tagId: ${targetAutotag.tagId})`
      );

      throw new AutotagError.UnexpectedDeletionError();
    }

    let deleteString: string;

    if (targetAutotag.key === `idol`) {
      const idol = Zephyr.getIdol(targetAutotag.value);

      if (!idol) {
        Logger.error(
          `Attempt to delete Autotag ID ${targetAutotag.id} failed - missing idol (value: ${targetAutotag.value})`
        );

        throw new AutotagError.UnexpectedDeletionError();
      }

      const groups = getGroupsByIdolId(idol.id, Zephyr.getCards());

      deleteString = `**${idol.name}** (${groups.join(
        `, `
      )}) will no longer be autotagged ${targetTag.emoji} **${
        targetTag.name
      }**.`;
    } else if (targetAutotag.key === `group`) {
      const group = Zephyr.getGroupById(targetAutotag.value);

      if (!group) {
        Logger.error(
          `Attempt to delete Autotag ID ${targetAutotag.id} failed - missing group (value: ${targetAutotag.value})`
        );

        throw new AutotagError.UnexpectedDeletionError();
      }

      deleteString = `**${group}** will no longer be autotagged ${targetTag.emoji} **${targetTag.name}**.`;
    } else if (targetAutotag.key === `wear`) {
      const conditionString = getConditionString(
        targetAutotag.value as 0 | 1 | 2 | 3 | 4 | 5
      );

      deleteString = `**${conditionString}** cards will no longer be autotagged ${targetTag.emoji} **${targetTag.name}**.`;
    } else if (targetAutotag.key === `issue`) {
      deleteString = `**#${targetAutotag.value}** cards will no longer be autotagged ${targetTag.emoji} **${targetTag.name}**.`;
    } else {
      Logger.error(
        `Attempt to delete Autotag ID ${targetAutotag.id} failed - invalid key (key: ${targetAutotag.key})`
      );

      throw new AutotagError.UnexpectedDeletionError();
    }

    await AutotagService.deleteAutotag(targetAutotag);

    const embed = new MessageEmbed(`Delete Autotag`, msg.author).setDescription(
      `✅ **Success!**\n${deleteString}`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
