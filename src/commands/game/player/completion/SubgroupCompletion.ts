import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { ChoiceEmbed } from "../../../../structures/display/ChoiceEmbed";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";
import { GridDisplay } from "../../../../structures/display/GridDisplay";
import { Subgroup } from "../../../../structures/game/BaseCard";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { InvalidSubgroupLookupQueryError } from "../../../../structures/error/ZephyrError";

export default class SubgroupCompletion extends BaseCommand {
  names = ["subgroupcompletion", "sgcomp"];
  description = "Shows you how far you are to completion for a subgroup";
  usage = ["$CMD$ <subgroup>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const sgQuery = options.join("");

    let subgroup: Subgroup;

    if (sgQuery.replace(/[^\w]/g, "").length === 0) {
      const lastCard = await ProfileService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      subgroup = { name: lastBase.subgroup!, group: lastBase.group! };
    } else {
      const subgroups = await CardService.findSubgroups(sgQuery);

      if (!subgroups.length) {
        throw new InvalidSubgroupLookupQueryError();
      } else if (subgroups.length === 1) {
        subgroup = subgroups[0];
      } else {
        const embed = new MessageEmbed()
          .setAuthor(
            `Subgroup completion | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `I found multiple matches for \`${sgQuery}\`.\nPlease reply with a number to confirm which subgroup you're talking about.\n`
          );

        const choiceEmbed = new ChoiceEmbed(
          this.zephyr,
          msg,
          embed,
          subgroups.map((sg) => `**${sg.group}** - ${sg.name}`)
        );

        const subgroupIndex = await choiceEmbed.ask();
        if (subgroupIndex === undefined) return;

        subgroup = subgroups[subgroupIndex];
      }
    }

    let subgroupCompletion = (
      await CompletionService.subgroupCompletion(
        profile,
        subgroup.group,
        subgroup.name
      )
    ).sort((a, b) => a.individualName.localeCompare(b.individualName));

    const percentage =
      (100 * subgroupCompletion.filter((c) => c.quantity > 0).length) /
      subgroupCompletion.length;

    const embed = new MessageEmbed()
      .setAuthor(
        `Subgroup completion | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(
        `${subgroupCompletion[0].groupName} - ${subgroupCompletion[0].subgroupName}`
      )
      .setDescription(
        percentage === 100
          ? "You've completed the set! :tada:"
          : `You are \`${
              percentage.toFixed(2).endsWith("00")
                ? percentage.toFixed(0)
                : percentage.toFixed(2)
            }%\` of the way to completion!`
      );

    const gridDisplay = new GridDisplay(
      subgroupCompletion.map(
        (c) =>
          `${
            c.quantity > 0
              ? `${this.zephyr.config.discord.emoji.check}`
              : ":white_medium_small_square:"
          } ${c.individualName} ${c.quantity > 0 ? `(${c.quantity})` : ""}`
      )
    );

    gridDisplay.render(embed);

    await msg.channel.createMessage({ embed });
  }
}
