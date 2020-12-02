import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import items from "../../../assets/items.json";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";
import { GameItem } from "../../../structures/game/Item";
import { checkPermission } from "../../../lib/ZephyrUtils";

export default class ItemInventory extends BaseCommand {
  names = ["items"];
  description = "Shows cards that belong to you.";

  private renderInventory(inv: GameItem[], prefix: string): string {
    if (inv.length === 0) {
      return `You have no items.`;
    } else
      return (
        inv
          .map((i) => {
            const itemEntry = items.items.filter(
              (item) => item.id === i.itemId
            )[0];
            return `— \`${itemEntry.name}\` **x${i.count}**`;
          })
          .join("\n") +
        `\n\nTo use an item, just type \`${prefix}use <item name>\`.`
      );
  }

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let page = 1;
    const inventory = await ProfileService.getItems(profile, page);
    const totalItems = await ProfileService.getNumberOfItems(profile);
    const maxPage = Math.ceil(totalItems / 10) || 1;

    const prefix = this.zephyr.getPrefix(msg.guildID!);
    const embed = new MessageEmbed()
      .setAuthor(
        `Items | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${msg.author.tag}'s items`)
      .setDescription(this.renderInventory(inventory, prefix))
      .setFooter(
        `Page 1 of ${maxPage} • ${totalItems.toLocaleString()} entries`
      );

    const sent = await msg.channel.createMessage({ embed });
    if (maxPage > 1) {
      const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
        userId === msg.author.id;
      const collector = new ReactionCollector(this.zephyr, sent, filter, {
        time: 5 * 60 * 1000,
      });
      collector.on(
        "collect",
        async (_m: Message, emoji: PartialEmoji, userId: string) => {
          if (emoji.name === "⏮️" && page !== 1) page = 1;
          if (emoji.name === "◀️" && page !== 1) page--;
          // numbers
          if (emoji.name === "▶️" && page !== maxPage) page++;
          if (emoji.name === "⏭️" && page !== maxPage) page = maxPage;

          const newItems = await ProfileService.getItems(profile, page);
          embed.setDescription(this.renderInventory(newItems, prefix));
          embed.setFooter(`Page ${page} of ${maxPage} • ${totalItems} entries`);
          await sent.edit({ embed });

          if (checkPermission("manageMessages", msg.channel, this.zephyr))
            await sent.removeReaction(emoji.name, userId);
        }
      );

      try {
        if (maxPage > 2) sent.addReaction(`⏮️`);
        if (maxPage > 1) sent.addReaction(`◀️`);
        // board.addReaction(`🔢`),
        if (maxPage > 1) sent.addReaction(`▶️`);
        if (maxPage > 2) sent.addReaction(`⏭️`);
      } catch (e) {}
    }
  }
}
