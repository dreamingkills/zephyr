import { EmbedField, Message } from "eris";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { ScrollingEmbed } from "../../../../structures/display/ScrollingEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { TotalCompletion as TotalCompletionType } from "../../../../structures/game/Completion";
import { GameProfile } from "../../../../structures/game/Profile";
import { GridDisplay } from "../../../../structures/display/GridDisplay";

export default class TotalCompletion extends BaseCommand {
  names = ["tcomp"];
  description = "";
  usage = [];
  allowDm = true;

  readonly pageSize = 12;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const completion = await CompletionService.totalCompletion(profile);
    const complete = completion.reduce((acc, val) => acc + val.complete, 0);
    const incomplete = completion.reduce((acc, val) => acc + val.incomplete, 0);
    const completionPercentage = 100 * (complete / (complete + incomplete));

    const embed = new MessageEmbed().setTitle("Total completion");

    const scrollingEmbed = new ScrollingEmbed(this.zephyr, msg, embed, {
      totalItems: completion.length,
      totalPages: Math.ceil(completion.length / this.pageSize),
      initialItems: this.renderCompletion(completion.slice(0, this.pageSize)),
      itemName: "group",
      embedDescription:
        completionPercentage === 100
          ? "Congratulations, you've collected every card! :tada:"
          : `You are \`${
              completionPercentage.toFixed(2).endsWith("00")
                ? completionPercentage.toFixed(0)
                : completionPercentage.toFixed(2)
            }%\` of the way to total completion!`,
    });

    scrollingEmbed.onPageChange((page) =>
      this.renderCompletion(
        completion.slice((page - 1) * this.pageSize, page * this.pageSize)
      )
    );

    await scrollingEmbed.send();
  }

  private renderCompletion(completion: TotalCompletionType[]): EmbedField[] {
    const gridDisplay = new GridDisplay(
      completion.map((c) => {
        const total = c.incomplete + c.complete;

        return `${
          c.incomplete === 0
            ? `${this.zephyr.config.discord.emoji.check}`
            : ":white_medium_small_square:"
        } **${c.group}** - ${c.complete}/${total}`;
      })
    );

    return gridDisplay.getFields();
  }
}
