import { Message } from "eris";
import { CardService } from "../../lib/database/services/game/CardService";
import { CompletionService } from "../../lib/database/services/game/CompletionService";
import { ChoiceEmbed } from "../../structures/display/ChoiceEmbed";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { MissingSubgroupOptionsError } from "../../structures/error/ZephyrError";
import { Subgroup } from "../../structures/game/BaseCard";
import { GameProfile } from "../../structures/game/Profile";
import { GridDisplay } from "../../structures/display/GridDisplay";

export default class Test extends BaseCommand {
  names = ["test"];
  description = "This is a test command";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const sgQuery = options.join("");

    if (sgQuery.replace(/[^\w]/g, "").length === 0) {
      throw new MissingSubgroupOptionsError();
    }

    const subgroups = await CardService.findSubgroups(sgQuery);
    let subgroup: Subgroup;

    if (subgroups.length === 1) {
      subgroup = subgroups[0];
    } else {
      const embed = new MessageEmbed().setTitle("pick one h");

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
        `Completion | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${subgroup.group} - ${subgroup.name}`)
      .setDescription(
        percentage === Infinity
          ? "You've completed the set!"
          : `You are \`${
              percentage.toFixed(2).endsWith("00")
                ? percentage.toFixed(0)
                : percentage.toFixed(2)
            }%\` of the way to completion`
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
