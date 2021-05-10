import { Message } from "eris";
import { AutotagService } from "../../../../lib/database/services/game/AutotagService";
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

export default class ChangePriority extends BaseCommand {
  id = `angreifer`;
  names = [`changepriority`, `prio`];
  description = `Changes the priority of an autotag constraint.`;
  usage = [`$CMD$ <current priority> <new priority>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const oldPriority = parseInt(options[0], 10);
    const newPriority = parseInt(options[1], 10);

    if (isNaN(oldPriority) || oldPriority < 1 || oldPriority > 255)
      throw new AutotagError.InvalidPriorityError();

    if (isNaN(newPriority) || newPriority < 1 || newPriority > 255)
      throw new AutotagError.InvalidPriorityError();

    if (oldPriority === newPriority)
      throw new AutotagError.RedundantPrioritySwitchError();

    const autotags = await AutotagService.getAutotags(profile);

    const targetAutotag = autotags.find((at) => at.priority === oldPriority);

    if (!targetAutotag) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      throw new AutotagError.PriorityNotFoundError(prefix);
    }

    const newPriorityAutotag = autotags.find(
      (at) => at.priority === newPriority
    );

    if (newPriorityAutotag) throw new AutotagError.PrioritySlotOccupiedError();

    let switchString: string;

    if (targetAutotag.key === `idol`) {
      const idol = Zephyr.getIdol(targetAutotag.value);

      if (!idol) {
        Logger.error(
          `Attempt to change Autotag ID ${targetAutotag.id} priority from ${oldPriority} to ${newPriority} failed - invalid idol (value: ${targetAutotag.value})`
        );

        throw new AutotagError.UnexpectedPriorityChangeError();
      }

      const groups = getGroupsByIdolId(idol.id, Zephyr.getCards());

      switchString = `**${idol.name}** (${groups.join(`, `)})`;
    } else if (targetAutotag.key === `group`) {
      const group = Zephyr.getGroupById(targetAutotag.value);

      if (!group) {
        Logger.error(
          `Attempt to change Autotag ID ${targetAutotag.id} priority from ${oldPriority} to ${newPriority} failed - invalid group (value: ${targetAutotag.value})`
        );

        throw new AutotagError.UnexpectedPriorityChangeError();
      }

      switchString = `**${group}**`;
    } else if (targetAutotag.key === `wear`) {
      const conditionString = getConditionString(
        targetAutotag.value as 0 | 1 | 2 | 3 | 4 | 5
      );

      switchString = `**${conditionString}** card`;
    } else if (targetAutotag.key === `issue`) {
      switchString = `**#${targetAutotag.value}** card`;
    } else {
      Logger.error(
        `Attempt to change Autotag ID ${targetAutotag.id} priority from ${oldPriority} to ${newPriority} failed - invalid key (key: ${targetAutotag.key})`
      );

      throw new AutotagError.UnexpectedPriorityChangeError();
    }

    await AutotagService.setAutotagPriority(targetAutotag, newPriority);

    const embed = new MessageEmbed(
      `Change Priority`,
      msg.author
    ).setDescription(
      `✅ **Success!**\nThe priority for the ${switchString} autotag has been changed from **${oldPriority}** to **${newPriority}**`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
