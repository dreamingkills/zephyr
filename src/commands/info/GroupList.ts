import { Message, PartialEmoji } from "eris";
import { checkPermission } from "../../lib/ZephyrUtils";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { ReactionCollector } from "eris-collector";

export default class GroupList extends BaseCommand {
  names = ["grouplist", "gl"];
  description = "Shows a list of all groups currently in the game.";
  usage = ["$CMD$"];
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const groups: string[] = [];
    this.zephyr.getCards().forEach((c) => {
      if (c.group) {
        if (!groups.includes(c.group)) groups.push(c.group);
      }
    });

    groups.sort((a, b) => (a > b ? 1 : -1));

    let page = 1;
    let totalPages = Math.ceil(groups.length / 10);

    const embed = new MessageEmbed(`Group List`, msg.author)
      .setDescription(
        this.renderGroups(
          groups.slice(page * 10 - 10, page * 10),
          groups,
          page
        ).join("\n")
      )
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${groups.length.toLocaleString()} groups`
      )
      .setTitle(`Zephyr group list (${page * 10 - 10 + 1}-${page * 10})`);

    const groupList = await this.send(msg.channel, embed);

    if (totalPages < 2) return;

    if (totalPages > 2) await this.react(groupList, `⏮`);
    if (totalPages > 1) await this.react(groupList, `◀`);
    if (totalPages > 1) await this.react(groupList, `▶`);
    if (totalPages > 2) await this.react(groupList, `⏭`);

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, groupList, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== totalPages) page++;
        if (emoji.name === "⏭" && page !== totalPages) page = totalPages;

        embed.setTitle(
          `Zephyr group list (${1 + 10 * page - 10}-${
            10 * page > groups.length ? groups.length : 10 * page
          })`
        );
        embed.setDescription(
          this.renderGroups(
            groups.slice(page * 10 - 10, page * 10),
            groups,
            page
          ).join("\n")
        );
        embed.setFooter(
          `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${
            groups.length
          } entries`
        );
        await this.edit(groupList, embed);

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await groupList.removeReaction(emoji.name, userId);
      }
    );
    return;
  }

  private renderGroups(
    groups: string[],
    allGroups: string[],
    page: number
  ): string[] {
    const leftPad = `#${page * 10}`.length;

    let groupList = [];

    for (let g of groups) {
      groupList.push(
        `\`${(`#` + (allGroups.indexOf(g) + 1)).padStart(
          leftPad,
          " "
        )}\` **${g}**`
      );
    }

    return groupList;
  }
}
