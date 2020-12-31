import { Message } from "eris";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { ScrollingEmbed } from "../../../../structures/client/ScrollingEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { TotalCompletion as TotalCompletionType } from "../../../../structures/game/Completion";
import { GameProfile } from "../../../../structures/game/Profile";

export default class TotalCompletion extends BaseCommand {
  names = ["tcomp"];
  description = "";
  usage = [];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const completion = await CompletionService.totalCompletion(profile);
    const pageSize = 10;

    const embed = new MessageEmbed().setTitle("Total completion");

    const scrollingEmbed = new ScrollingEmbed(this.zephyr, msg, embed, {
      totalItems: completion.length,
      totalPages: Math.ceil(completion.length / pageSize),
      initialItems: this.renderCompletion(completion.slice(0, pageSize)),
      itemName: "group",
    });

    scrollingEmbed.onPageChange((page) =>
      this.renderCompletion(
        completion.slice((page - 1) * pageSize, page * pageSize)
      )
    );

    await scrollingEmbed.send();
  }

  private renderCompletion(completion: TotalCompletionType[]): string {
    return completion
      .map((c) => {
        const total = c.incomplete + c.complete;

        return `**${c.group || "(no group)"}** - ${c.complete}/${total} ${
          total === 1 ? "subgroup" : "subgroups"
        } (${Math.floor((100 * c.complete) / total)}%)`;
      })
      .join("\n");
  }
}
