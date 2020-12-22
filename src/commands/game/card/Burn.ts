import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { items } from "../../../assets/items.json";
import { BaseItem } from "../../../structures/game/Item";
import { GameDye } from "../../../structures/game/Dye";
import { getDescriptions } from "../../../lib/ZephyrUtils";

export default class BurnCard extends BaseCommand {
  names = ["burn", "b"];
  description = "Burns a card or dye, giving you resources in exchange.";
  usage = ["$CMD$ [cards/dyes]"];
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const identifiers = this.options;

    const burnTargets: (GameUserCard | GameDye)[] = [];

    if (identifiers.length === 0) {
      const lastCard = await CardService.getLastCard(profile.discordId);
      burnTargets.push(lastCard);
    }

    for (let id of identifiers) {
      if (id.startsWith("$")) {
        if (isNaN(parseInt(id.slice(1), 36)))
          throw new ZephyrError.InvalidDyeIdentifierBurnError(id);

        // Parse as a dye
        const dyeTarget = await ProfileService.getDyeByIdentifier(id);
        if (dyeTarget.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfDyeError(dyeTarget.id);

        burnTargets.push(dyeTarget);
      } else {
        if (isNaN(parseInt(id, 36)))
          throw new ZephyrError.InvalidCardIdentifierBurnError(id);

        // Parse as a card
        const cardTarget = await CardService.getUserCardByIdentifier(id);
        if (cardTarget.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(cardTarget);

        burnTargets.push(cardTarget);
      }
    }

    const itemRewards: { item: BaseItem; count: number }[] = [];

    const dyeTargets = burnTargets.filter(
      (t) => t instanceof GameDye
    ) as GameDye[];
    if (dyeTargets[0]) {
      const glassItem = items.filter((i) => i.name === "Glass")[0];
      itemRewards.push({ item: glassItem, count: dyeTargets.length });

      const droplets = dyeTargets.filter((d) => d.charges > 0);
      if (droplets.length > 0) {
        const dropletItem = items.filter((i) => i.name === "Droplet")[0];
        itemRewards.push({ item: dropletItem, count: droplets.length });
      }
    }

    const cardTargets = burnTargets.filter(
      (t) => t instanceof GameUserCard
    ) as GameUserCard[];

    const individualRewards = [
      0,
      ...cardTargets.map((c) => {
        return Math.round(15 * c.luckCoefficient * ((c.wear || 1) * 1.25));
      }),
    ];
    const bitReward = individualRewards.reduce((acc, bits) => acc + bits);

    const dustItems = items.filter((i) => i.type === "DUST") as BaseItem[];

    for (let card of cardTargets) {
      if (card.wear === 0) continue;
      const targetDustItem = dustItems[card.wear - 1];

      const dustRewardsQuery = itemRewards.filter(
        (r) => r.item.id === targetDustItem.id
      )[0];
      if (dustRewardsQuery) {
        itemRewards[itemRewards.indexOf(dustRewardsQuery)] = {
          item: targetDustItem,
          count: dustRewardsQuery.count + 1,
        };
      } else {
        itemRewards.push({ item: targetDustItem, count: 1 });
      }
    }

    const tags = await ProfileService.getTags(profile);

    let embedDescription = `Really burn `;
    if (cardTargets.length > 0) {
      embedDescription += `**${cardTargets.length.toLocaleString()}** card${
        cardTargets.length === 1 ? `` : `s`
      }${dyeTargets.length > 0 ? ` and ` : ``}`;
    }
    if (dyeTargets.length > 0) {
      embedDescription += `**${dyeTargets.length.toLocaleString()}** dye${
        dyeTargets.length === 1 ? `` : `s`
      }`;
    }
    embedDescription += `?`;

    const targetDescriptions = getDescriptions(
      burnTargets.slice(0, 5),
      this.zephyr,
      tags
    );
    embedDescription += `\n${targetDescriptions.join("\n")}`;

    const rewardsText = [];
    if (bitReward > 0)
      rewardsText.push(
        `:white_medium_small_square: ${
          this.zephyr.config.discord.emoji.bits
        } **${bitReward.toLocaleString()}**`
      );

    for (let item of itemRewards) {
      rewardsText.push(
        `:white_medium_small_square: **${item.count}x** \`${item.item.name}\``
      );
    }

    embedDescription +=
      `${
        burnTargets.length > 5
          ? `\n*... and ${burnTargets.length - 5} more ...*`
          : ``
      }\n\nYou will receive:\n` +
      (rewardsText.length === 0 ? `*... nothing ...*` : rewardsText.join("\n"));

    const embed = new MessageEmbed()
      .setAuthor(`Burn | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(embedDescription);

    const confirmation = await msg.channel.createMessage({ embed });

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let card of cardTargets) {
        const refetchCard = await CardService.getUserCardById(card.id);
        if (refetchCard.discordId !== msg.author.id) {
          await confirmation.edit({
            embed: embed.setFooter(
              `⚠️ ${card.id.toString(36)} does not belong to you.`
            ),
          });
          return;
        }
      }
      for (let dye of dyeTargets) {
        try {
          const refetchDye = await ProfileService.getDyeById(dye.id);
          if (refetchDye.discordId !== msg.author.id)
            throw new ZephyrError.NotOwnerOfDyeError(dye.id);
        } catch {
          await confirmation.edit({
            embed: embed.setFooter(
              `⚠️ ${dye.id.toString(36)} does not belong to you.`
            ),
          });
          return;
        }
      }

      // Give the cards to the bot
      if (cardTargets.length > 0)
        await CardService.burnCards(cardTargets, this.zephyr);
      // Delete the dyes
      if (dyeTargets.length > 0) await ProfileService.burnDyes(dyeTargets);

      // Give the user their dust/glass/droplets and bits
      if (itemRewards.length > 0)
        await ProfileService.addItems(profile, itemRewards);
      if (bitReward > 0)
        await ProfileService.addBitsToProfile(profile, bitReward);

      let footer = `🔥 `;
      if (cardTargets.length > 0) {
        footer += `${cardTargets.length.toLocaleString()} card${
          cardTargets.length === 1 ? `` : `s`
        }${dyeTargets.length > 0 ? ` and ` : ``}`;
      }
      if (dyeTargets.length > 0) {
        footer += `${dyeTargets.length.toLocaleString()} dye${
          dyeTargets.length === 1 ? `` : `s`
        }`;
      }

      if (cardTargets.length > 1 || dyeTargets.length > 1) {
        footer += ` have`;
      } else footer += ` has`;

      await confirmation.edit({
        embed: embed.setFooter(`${footer} been destroyed.`),
      });
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This confirmation has expired.`),
        });
      }
      try {
        await confirmation.removeReactions();
      } catch {}
    });

    await confirmation.addReaction(
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
  }
}
