import { EmbedField, Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { ChoiceEmbed } from "../../../../structures/display/ChoiceEmbed";
import { GridDisplay } from "../../../../structures/display/GridDisplay";
import { ScrollingEmbed } from "../../../../structures/display/ScrollingEmbed";
import { InvalidGroupLookupQueryError } from "../../../../structures/error/ZephyrError";
import { GameGroupCompletion } from "../../../../structures/game/Completion";
import { GameProfile } from "../../../../structures/game/Profile";

export default class GroupCompletion extends BaseCommand {
  names = ["groupcompletion", "gcomp"];
  description = "Shows you how far you are to completion for a group/soloist";
  usage = ["$CMD$ <group>"];
  allowDm = true;

  readonly pageSize = 12;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const groupQuery = options.join("");

    let group: string;

    if (groupQuery.replace(/[^\w]/g, "").length === 0) {
      const lastCard = await ProfileService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      group = lastBase.group!;
    } else {
      const groups = await CardService.findGroups(groupQuery);

      if (!groups.length) {
        throw new InvalidGroupLookupQueryError();
      } else if (groups.length === 1) {
        group = groups[0];
      } else {
        const embed = new MessageEmbed()
          .setAuthor(
            `Group completion | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `I found multiple matches for \`${groupQuery}\`.\nPlease reply with a number to confirm which group you're talking about.\n`
          );

        const choiceEmbed = new ChoiceEmbed(this.zephyr, msg, embed, groups);

        const groupIndex = await choiceEmbed.ask();
        if (groupIndex === undefined) return;

        group = groups[groupIndex];
      }
    }

    const completion = await CompletionService.groupCompletion(profile, group);

    const embed = new MessageEmbed()
      .setAuthor(
        `Group completion | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${group}`);

    const scrollingEmbed = new ScrollingEmbed(this.zephyr, msg, embed, {
      totalItems: completion.length,
      totalPages: Math.ceil(completion.length / this.pageSize),
      initialItems: this.renderCompletion(completion.slice(0, this.pageSize)),
      itemName: "subgroup",
    });

    scrollingEmbed.onPageChange((page) =>
      this.renderCompletion(
        completion.slice((page - 1) * this.pageSize, page * this.pageSize)
      )
    );

    await scrollingEmbed.send();
  }

  private renderCompletion(completion: GameGroupCompletion[]): EmbedField[] {
    const gridDisplay = new GridDisplay(
      completion.map((c) => {
        const total = c.have + c.missing;

        return `${
          c.missing === 0
            ? `${this.zephyr.config.discord.emoji.check}`
            : ":white_medium_small_square:"
        } **${c.subgroupName}** - ${c.have}/${total}`;
      })
    );

    return gridDisplay.getFields();
  }
}
