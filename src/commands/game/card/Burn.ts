import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { items } from "../../../assets/Items";
import { GameDye } from "../../../structures/game/Dye";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { PrefabItem } from "../../../structures/item/PrefabItem";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";

export default class BurnCard extends BaseCommand {
  names = ["burn", "b"];
  description = "Burns a card or dye, giving you resources in exchange.";
  usage = ["$CMD$ [cards/dyes]"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const burnTargets: (GameUserCard | GameDye)[] = [];

    if (options.length === 0) {
      const lastCard = await CardService.getLastCard(profile);
      burnTargets.push(lastCard);
    }

    for (let id of options) {
      if (id.startsWith("$")) {
        if (isNaN(parseInt(id.slice(1), 36)))
          throw new ZephyrError.InvalidDyeIdentifierBurnError(id);

        // Parse as a dye
        const dyeTarget = await ProfileService.getDyeByIdentifier(id);

        if (
          burnTargets.find((i) => i instanceof GameDye && i.id === dyeTarget.id)
        )
          continue;

        if (dyeTarget.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfDyeError(dyeTarget);

        burnTargets.push(dyeTarget);
      } else {
        if (isNaN(parseInt(id, 36)))
          throw new ZephyrError.InvalidCardIdentifierBurnError(id);

        // Parse as a card
        const cardTarget = await CardService.getUserCardByIdentifier(id);

        if (
          burnTargets.find(
            (i) => i instanceof GameUserCard && i.id === cardTarget.id
          )
        )
          continue;

        if (cardTarget.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(cardTarget);

        const isInAlbum = await AlbumService.cardIsInAlbum(cardTarget);
        if (isInAlbum) throw new ZephyrError.CardInAlbumError(cardTarget);

        burnTargets.push(cardTarget);
      }
    }

    const itemRewards: { item: PrefabItem; count: number }[] = [];

    const dyeTargets = burnTargets.filter(
      (t) => t instanceof GameDye
    ) as GameDye[];

    if (dyeTargets.length > 0) {
      const glassItem = items.find((i) => i.names.includes(`Glass`));
      if (!glassItem) throw new ZephyrError.ItemMissingError(`Glass`);

      itemRewards.push({ item: glassItem, count: dyeTargets.length });

      const droplets = dyeTargets.filter((d) => d.charges > 0).length;
      if (droplets > 0) {
        const dropletItem = items.find((i) => i.names.includes(`Droplet`));
        if (!dropletItem) throw new ZephyrError.ItemMissingError(`Droplet`);

        itemRewards.push({ item: dropletItem, count: droplets });
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

    const dustItems = items.filter((i) =>
      i.names[0].includes("Dust")
    ) as PrefabItem[];

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
        `:white_medium_small_square: **${item.count}x** \`${item.item.names[0]}\``
      );
    }

    embedDescription +=
      `${
        burnTargets.length > 5
          ? `\n*... and ${burnTargets.length - 5} more ...*`
          : ``
      }\n\nYou will receive:\n` +
      (rewardsText.length === 0 ? `*... nothing ...*` : rewardsText.join("\n"));

    const embed = new MessageEmbed(`Burn`, msg.author).setDescription(
      embedDescription
    );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 15000,
      max: 1,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let target of [...cardTargets, ...dyeTargets]) {
        const refetch = await target.fetch();

        if (refetch instanceof GameDye) {
          if (refetch.discordId !== msg.author.id)
            throw new ZephyrError.NotOwnerOfDyeError(refetch);
        } else if (refetch instanceof GameUserCard) {
          if (refetch.discordId !== msg.author.id)
            throw new ZephyrError.NotOwnerOfCardError(refetch);

          const isInAlbum = await AlbumService.cardIsInAlbum(refetch);
          if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetch);
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

    await this.react(
      confirmation,
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
