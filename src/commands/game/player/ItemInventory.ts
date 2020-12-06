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
  description = "Shows items that belong to you.";

  private renderInventory(
    inv: GameItem[],
    prefix: string,
    profile: GameProfile
  ): string {
    let desc =
      (profile.dustPoor > 0
        ? `:white_medium_small_square: \`★☆☆☆☆\` **Dust** x${profile.dustPoor.toLocaleString()}\n`
        : ``) +
      (profile.dustAverage > 0
        ? `:white_medium_small_square: \`★★☆☆☆\` **Dust** x${profile.dustAverage.toLocaleString()}\n`
        : ``) +
      (profile.dustGood > 0
        ? `:white_medium_small_square: \`★★★☆☆\` **Dust** x${profile.dustGood.toLocaleString()}\n`
        : ``) +
      (profile.dustGreat > 0
        ? `:white_medium_small_square: \`★★★★☆\` **Dust** x${profile.dustGreat.toLocaleString()}\n`
        : ``) +
      (profile.dustMint > 0
        ? `:white_medium_small_square: \`★★★★★\` **Dust** x${profile.dustMint.toLocaleString()}\n`
        : ``) +
      `\n`;
    if (inv.length === 0) {
      return desc + `You have no items.`;
    } else
      return (
        desc +
        (inv
          .map((i) => {
            const itemEntry = items.items.filter(
              (item) => item.id === i.itemId
            )[0];
            return `— \`${itemEntry.name}\` **x${i.count}**`;
          })
          .join("\n") +
          `\n\nCheck \`${prefix}help use\` for usage information.`)
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
      .setDescription(this.renderInventory(inventory, prefix, profile))
      .setFooter(
        `Page 1 of ${maxPage} • ${totalItems.toLocaleString()} entries`
      );

    const sent = await msg.channel.createMessage({ embed });
    if (maxPage > 1) {
      const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
        userId === msg.author.id;
      const collector = new ReactionCollector(this.zephyr, sent, filter, {
        time: 2 * 60 * 1000,
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
          embed.setDescription(this.renderInventory(newItems, prefix, profile));
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
