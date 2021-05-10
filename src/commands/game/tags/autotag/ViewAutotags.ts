import { Message } from "eris";
import { AutotagService } from "../../../../lib/database/services/game/AutotagService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import {
  getConditionString,
  getGroupsByIdolId,
} from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";

export default class ViewAutotags extends BaseCommand {
  id = `unsainted`;
  names = [`autotags`, `at`];
  description = `Shows you a list of your autotag constraints.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const autotags = await AutotagService.getAutotags(profile);
    const tags = await ProfileService.getTags(profile);

    const sortedAutotags = autotags.sort((a, b) => a.priority - b.priority);

    const autotagStrings = [];

    const padLeft = autotags.length >= 10 ? 2 : 1;

    for (let autotag of sortedAutotags) {
      const autotagTag = tags.find((t) => t.id === autotag.tagId);

      if (!autotagTag) continue;

      if (autotag.key === `idol`) {
        const idol = Zephyr.getIdol(autotag.value);

        if (!idol) continue;

        const groups = getGroupsByIdolId(idol.id, Zephyr.getCards());

        autotagStrings.push(
          `\`${autotag.priority.toString().padStart(padLeft, ` `)}\` **${
            idol.name
          }** (${groups.join(`, `)}) - ${autotagTag.emoji} **${
            autotagTag.name
          }**`
        );
      } else if (autotag.key === `group`) {
        const group = Zephyr.getGroupById(autotag.value);

        if (!group) continue;

        autotagStrings.push(
          `\`${autotag.priority
            .toString()
            .padStart(padLeft, ` `)}\` **${group}** - ${autotagTag.emoji} **${
            autotagTag.name
          }**`
        );
      } else if (autotag.key === `wear`) {
        const condition = getConditionString(
          autotag.value as 0 | 1 | 2 | 3 | 4 | 5
        );

        autotagStrings.push(
          `\`${autotag.priority
            .toString()
            .padStart(padLeft, ` `)}\` **${condition}** cards - ${
            autotagTag.emoji
          } **${autotagTag.name}**`
        );
      } else if (autotag.key === `issue`) {
        autotagStrings.push(
          `\`${autotag.priority.toString().padStart(padLeft, ` `)}\` **#${
            autotag.value
          }** cards - ${autotagTag.emoji} **${autotagTag.name}**`
        );
      }
    }

    const embed = new MessageEmbed(`Autotags`, msg.author).setTitle(
      `${msg.author.tag}'s autotags`
    );

    if (autotags.length === 0) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      embed.setDescription(
        `**You don't have any autotags!**\nYou can create some by using \`${prefix}createautotag\`!`
      );
    } else embed.setDescription(autotagStrings.join(`\n`));

    await this.send(msg.channel, embed);
    return;
  }
}
