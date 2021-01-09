import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { ChoiceEmbed } from "../../../../structures/display/ChoiceEmbed";
import { GridDisplay } from "../../../../structures/display/GridDisplay";
import { InvalidLookupQueryError } from "../../../../structures/error/ZephyrError";
import { Member as Individual } from "../../../../structures/game/BaseCard";
import { GameProfile } from "../../../../structures/game/Profile";

export default class MemberCompletion extends BaseCommand {
  names = ["membercompletion", "mcomp"];
  description =
    "Shows you how far you are to completion for a member of a group/soloist";
  usage = ["$CMD$ <member name>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const nameQuery = options.join("");

    let individual: Individual;

    if (nameQuery.replace(/[^\w]/g, "").length === 0) {
      const lastCard = await ProfileService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      individual = { name: lastBase.name, group: lastBase.group ?? undefined };
    } else {
      const individuals = await CardService.findIndividuals(nameQuery);

      if (!individuals.length) {
        throw new InvalidLookupQueryError();
      } else if (individuals.length === 1) {
        individual = individuals[0];
      } else {
        const embed = new MessageEmbed()
          .setAuthor(
            `Group completion | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `I found multiple matches for \`${nameQuery}\`.\nPlease reply with a number to confirm which person you're talking about.\n`
          );

        const choiceEmbed = new ChoiceEmbed(
          this.zephyr,
          msg,
          embed,
          individuals.map((sg) =>
            sg.group ? `**${sg.group}** - ${sg.name}` : sg.name
          )
        );

        const individualIndex = await choiceEmbed.ask();
        if (individualIndex === undefined) return;

        individual = individuals[individualIndex];
      }
    }

    const completion = await CompletionService.memberCompletion(
      profile,
      individual.group,
      individual.name
    );

    const gridDisplay = new GridDisplay(
      completion.map(
        (c) =>
          `${
            c.quantity > 0
              ? `${this.zephyr.config.discord.emoji.check}`
              : ":white_medium_small_square:"
          } ${c.subgroupName} ${c.quantity > 0 ? `(${c.quantity})` : ""}`
      )
    );

    const percentage =
      (100 * completion.filter((c) => c.quantity > 0).length) /
      completion.length;

    const embed = new MessageEmbed()
      .setAuthor(
        `Completion | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(
        individual.group
          ? `${individual.group} - ${individual.name}`
          : individual.name
      )
      .setDescription(
        percentage === 100
          ? "You've completed this individual! :tada:"
          : `You are \`${
              percentage.toFixed(2).endsWith("00")
                ? percentage.toFixed(0)
                : percentage.toFixed(2)
            }%\` of the way to completion!`
      );

    gridDisplay.render(embed);

    await this.send(msg.channel, embed);
  }
}
