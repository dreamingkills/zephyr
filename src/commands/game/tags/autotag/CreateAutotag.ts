import { Message } from "eris";
import { AutotagService } from "../../../../lib/database/services/game/AutotagService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { getGroupsByIdolId } from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { BaseCommand } from "../../../../structures/command/Command";
import { AutotagError } from "../../../../structures/error/AutotagError";
import { GameIdol } from "../../../../structures/game/Idol";
import { GameProfile } from "../../../../structures/game/Profile";
import { MessageCollector } from "eris-collector";

export default class CreateAutotag extends BaseCommand {
  id = `invisible`;
  names = [`createautotag`, `cat`];
  description = `Creates a new autotag constraint.`;
  usage = [
    `$CMD$ idol <idol name> <tag name>`,
    `$CMD$ group <group name> <tag name>`,
    `$CMD$ condition <damaged/poor/average/good/great/mint> <tag name>`,
    `$CMD$ issue <serial number> <tag name>`,
  ];
  allowDm = true;

  private autotagTypes = [`idol`, `group`, `condition`, `issue`];
  private conditionNames = [
    `damaged`,
    `poor`,
    `average`,
    `good`,
    `great`,
    `mint`,
  ];

  private autotagLimits = {
    0: 3,
    1: 5,
    2: 7,
    3: 9,
    4: 12,
    5: 15,
  };

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const autotagType = options[0]?.toLowerCase();
    const prefix = Zephyr.getPrefix(msg.guildID);

    const autotags = await AutotagService.getAutotags(profile);

    const limit = this.autotagLimits[profile.patron];

    if (autotags.length >= limit)
      throw new AutotagError.AutotagLimitReachedError(
        profile.patron === 5,
        prefix
      );

    if (!autotagType || !this.autotagTypes.includes(autotagType))
      throw new AutotagError.InvalidAutotagTypeError(prefix);

    if (!options[1]) {
      if (autotagType === `idol`) throw new AutotagError.InvalidIdolNameError();

      if (autotagType === `group`)
        throw new AutotagError.InvalidGroupNameError();

      if (autotagType === `condition`)
        throw new AutotagError.InvalidConditionError();

      if (autotagType === `issue`) throw new AutotagError.InvalidIssueError();
    }

    const autotagValue = options.slice(1, -1).join(` `).toLowerCase();

    if (!options[2]) throw new AutotagError.InvalidTagNameError();

    const tagName = options[options.length - 1].toLowerCase();

    const tags = await ProfileService.getTags(profile);

    const tag = tags.find((t) => t.name.toLowerCase() === tagName);

    if (!tag) throw new AutotagError.TagNotFoundError();

    const newPriority =
      (autotags.sort((a, b) => b.priority - a.priority)[0]?.priority || 0) + 1;

    let embed: MessageEmbed;

    if (autotagType === `idol`) {
      const idolMatches = Zephyr.getIdolsByName(autotagValue);

      if (idolMatches.length === 0) throw new AutotagError.IdolNotFoundError();

      let idol: GameIdol;

      if (idolMatches.length === 1) {
        idol = idolMatches[0];
      } else {
        const cards = Zephyr.getCards();

        const selectionEmbed = new MessageEmbed(
          `Create Autotag`,
          msg.author
        ).setDescription(
          `I found multiple matches for **${autotagValue}**.\nPlease reply with a number to confirm which idol you're talking about.\n${idolMatches
            .map(
              (i) =>
                `— \`${idolMatches.indexOf(i) + 1}\` **${
                  i.name
                }** (${getGroupsByIdolId(i.id, cards)})`
            )
            .join(`\n`)}`
        );

        const selectionMessage = await this.send(msg.channel, selectionEmbed);

        const idolIndex: number | undefined = await new Promise((res) => {
          const filter = (m: Message) =>
            idolMatches[parseInt(m.content) - 1] &&
            m.author.id === msg.author.id;

          const collector = new MessageCollector(Zephyr, msg.channel, filter, {
            time: 30000,
            max: 1,
          });

          collector.on("error", async (e: Error) => {
            await this.handleError(msg, msg.author, e);
            collector.stop();
          });

          collector.on("collect", async (m: Message) => {
            res(parseInt(m.content) - 1);
            collector.stop();
          });

          collector.on("end", async (_c: any, reason: string) => {
            if (reason === "time") res(undefined);
          });
        });

        if (idolIndex === undefined || idolIndex < 0) {
          await this.edit(
            selectionMessage,
            selectionEmbed.setFooter(`🕒 This selection has expired.`)
          );

          return;
        }

        await this.delete(selectionMessage);

        idol = idolMatches[idolIndex];
      }

      const groups = getGroupsByIdolId(idol.id, Zephyr.getCards());

      const duplicate = autotags.find(
        (at) => at.key === `idol` && at.value === idol.id
      );

      if (duplicate) {
        const tag = tags.find((t) => t.id === duplicate.tagId);

        throw new AutotagError.DuplicateIdolConstraintError(idol, tag!, groups);
      }

      const newAutotag = await AutotagService.createAutotag(
        profile,
        `idol`,
        idol.id,
        tag,
        newPriority
      );

      embed = new MessageEmbed(`Create Autotag`, msg.author).setDescription(
        `✅ **Success!**\nCreated a new constraint for **${
          idol.name
        }** (${groups.join(`, `)}) with priority **${
          newAutotag.priority
        }**.\nAny cards claimed that match this criteria will be autotagged ${
          tag.emoji
        } **${tag.name}**.`
      );
    } else if (autotagType === `group`) {
      const groupId = Zephyr.getGroupIdByName(autotagValue);

      if (!groupId) throw new AutotagError.GroupNotFoundError();

      const groupName = Zephyr.getGroupById(groupId)!;

      const duplicate = autotags.find(
        (at) => at.key === `group` && at.value === groupId
      );

      if (duplicate) {
        const tag = tags.find((t) => t.id === duplicate.tagId);

        throw new AutotagError.DuplicateGroupConstraintError(groupName, tag!);
      }

      const newAutotag = await AutotagService.createAutotag(
        profile,
        `group`,
        groupId,
        tag,
        newPriority
      );

      embed = new MessageEmbed(`Create Autotag`, msg.author).setDescription(
        `✅ **Success!**\nCreated a new constraint for **${groupName}** with priority **${newAutotag.priority}**.\nAny cards claimed that match this criteria will be autotagged ${tag.emoji} **${tag.name}**.`
      );
    } else if (autotagType === `condition`) {
      const conditionIndex = this.conditionNames.indexOf(autotagValue);

      if (conditionIndex < 0) throw new AutotagError.ConditionNotFoundError();

      const capitalizedCondition =
        this.conditionNames[conditionIndex].charAt(0).toUpperCase() +
        this.conditionNames[conditionIndex].slice(1);

      const duplicate = autotags.find(
        (at) => at.key === `wear` && at.value === conditionIndex
      );

      if (duplicate) {
        const tag = tags.find((t) => t.id === duplicate.tagId);

        throw new AutotagError.DuplicateWearConstraintError(
          capitalizedCondition,
          tag!
        );
      }

      const newAutotag = await AutotagService.createAutotag(
        profile,
        `wear`,
        conditionIndex,
        tag,
        newPriority
      );

      embed = new MessageEmbed(`Create Autotag`, msg.author).setDescription(
        `✅ **Success!**\nCreated a new constraint for **${capitalizedCondition}** cards with priority **${newAutotag.priority}**.\nAny cards claimed that match this critera will be autotagged ${tag.emoji} **${tag.name}**.`
      );
    } else if (autotagType === `issue`) {
      const targetIssue = parseInt(autotagValue, 10);

      if (isNaN(targetIssue) || targetIssue < 1 || targetIssue > 65535)
        throw new AutotagError.IssueOutOfBoundsError();

      const duplicate = autotags.find(
        (at) => at.key === `issue` && at.value === targetIssue
      );

      if (duplicate) {
        const tag = tags.find((t) => t.id === duplicate.tagId)!;

        throw new AutotagError.DuplicateIssueConstraintError(targetIssue, tag);
      }

      const newAutotag = await AutotagService.createAutotag(
        profile,
        `issue`,
        targetIssue,
        tag,
        newPriority
      );

      embed = new MessageEmbed(`Create Autotag`, msg.author).setDescription(
        `✅ **Success!**\nCreated a new constraint for **#${targetIssue}** cards with priority **${newAutotag.priority}**.\nAny cards claimed that match this criteria will be autotagged ${tag.emoji} **${tag.name}**.`
      );
    } else {
      throw new AutotagError.InvalidAutotagTypeError(prefix);
    }

    await this.send(msg.channel, embed);
    return;
  }
}
