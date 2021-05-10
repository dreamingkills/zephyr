import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";
import { GameItem } from "../../../structures/game/Item";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { getItemById } from "../../../assets/Items";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ItemInventory extends BaseCommand {
  id = `ritual`;
  names = ["items"];
  description = "Shows items that belong to you.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let page = 1;
    const inventory = await ProfileService.getItems(profile, page);
    const totalItems = await ProfileService.getNumberOfItems(profile);
    const maxPage = Math.ceil(totalItems / 10) || 1;

    const prefix = Zephyr.getPrefix(msg.guildID!);
    const embed = new MessageEmbed(`Items`, msg.author)
      .setTitle(`${msg.author.tag}'s items`)
      .setDescription(this.renderInventory(inventory, prefix))
      .setFooter(
        `Page 1 of ${maxPage} • ${totalItems.toLocaleString()} entries`
      );

    const sent = await this.send(msg.channel, embed);
    if (maxPage > 1) {
      const filter = (_m: Message, _emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id;

      const collector = new ReactionCollector(Zephyr, sent, filter, {
        time: 2 * 60 * 1000,
      });
      collector.on("error", async (e: Error) => {
        await this.handleError(msg, msg.author, e);
      });

      collector.on(
        "collect",
        async (_m: Message, emoji: PartialEmoji, user: User) => {
          if (emoji.name === "⏮" && page !== 1) page = 1;
          if (emoji.name === "◀" && page !== 1) page--;
          // numbers
          if (emoji.name === "▶" && page !== maxPage) page++;
          if (emoji.name === "⏭" && page !== maxPage) page = maxPage;

          const newItems = await ProfileService.getItems(profile, page);
          embed.setDescription(this.renderInventory(newItems, prefix));
          embed.setFooter(`Page ${page} of ${maxPage} • ${totalItems} entries`);
          await sent.edit({ embed });

          if (checkPermission("manageMessages", msg.channel))
            await sent.removeReaction(emoji.name, user.id);
        }
      );

      try {
        if (maxPage > 2) await this.react(sent, `⏮`);
        if (maxPage > 1) await this.react(sent, `◀`);
        if (maxPage > 1) await this.react(sent, `▶`);
        if (maxPage > 2) await this.react(sent, `⏭`);
      } catch (e) {}
    }
  }

  private renderInventory(inv: GameItem[], prefix: string): string {
    if (inv.length === 0) {
      return `You have no items.`;
    } else
      return (
        inv
          .map((i) => {
            const itemEntry = getItemById(i.itemId);
            return `— \`${itemEntry?.names[0] || `Unknown Item`}\` **x${
              i.quantity
            }**`;
          })
          .join("\n") + `\n\nCheck \`${prefix}help use\` for usage information.`
      );
  }
}
