import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { Filter } from "../../../lib/database/sql/Filters";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ReactionCollector } from "eris-collector";
import { checkPermission, idToIdentifier } from "../../../lib/ZephyrUtils";

export default class CardInventory extends BaseCommand {
  names = ["inventory", "inv", "i"];
  description = "Shows cards that belong to you.";
  usage = [
    "$CMD$ <filters>",
    "Filters:\n— group=LOONA\n— name=JinSoul\n— serial=>5\n— serial=<5\n— serial=5",
  ];

  private renderInventory(cards: GameUserCard[]): string {
    let desc: string[] = [];
    if (cards.length === 0) return "";
    const longestId = idToIdentifier(
      [...cards].sort((a, b) =>
        idToIdentifier(a.id) > idToIdentifier(b.id) ? 1 : -1
      )[0].id
    ).length;
    for (let card of cards) {
      const baseCard = this.zephyr.getCard(card.baseCardId);
      const entry =
        `\`${idToIdentifier(card.id).padStart(
          longestId,
          " "
        )}\` : \`${"★".repeat(card.wear).padEnd(5, "☆")}\` : \`#${
          card.serialNumber
        }\` ` +
        (baseCard.group ? `**${baseCard.group}** ` : ``) +
        `${baseCard.name}`;
      desc.push(entry);
    }
    return desc.join("\n");
  }

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const optionsRaw = this.options.filter((v) => v.includes("="));
    const options: Filter = {};
    for (let opt of optionsRaw) {
      const key = opt.split("=")[0];
      const value = opt.split("=")[1];
      options[key] = value;
    }

    const size = await CardService.getUserInventorySize(profile, options);

    if (
      !options["page"] ||
      isNaN(parseInt(<string>options["page"], 10)) ||
      options["page"] < 1
    )
      options["page"] = 1;
    const totalPages = Math.ceil(size / 10) || 1;
    if (options["page"] > totalPages) options["page"] = totalPages;

    let page = parseInt(options["page"] as string, 10);
    const inventory = await CardService.getUserInventory(profile, options);

    const embed = new MessageEmbed()
      .setAuthor(
        `Inventory | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${msg.author.tag}'s cards`)
      .setDescription(this.renderInventory(inventory))
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${size} cards`
      );
    const sent = await msg.channel.createMessage({ embed });
    if (totalPages < 2) return;

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
        if (emoji.name === "▶️" && page !== totalPages) page++;
        if (emoji.name === "⏭️" && page !== totalPages) page = totalPages;

        options["page"] = page;
        const newCards = await CardService.getUserInventory(profile, options);
        embed.setDescription(this.renderInventory(newCards));
        embed.setFooter(`Page ${page} of ${totalPages} • ${size} entries`);
        await sent.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await sent.removeReaction(emoji.name, userId);
      }
    );

    if (totalPages > 2) sent.addReaction(`⏮️`);
    if (totalPages > 1) sent.addReaction(`◀️`);
    // board.addReaction(`🔢`),
    if (totalPages > 1) sent.addReaction(`▶️`);
    if (totalPages > 2) sent.addReaction(`⏭️`);
  }
}
