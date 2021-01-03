import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { getDescriptions } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";

export default class Trade extends BaseCommand {
  names = ["trade"];
  description = "Trades one of your cards for someone else's card.";
  usage = ["$CMD$ <@mention> <your card> <their card>"];

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const target = await ProfileService.getProfile(targetUser.id);
    if (
      target.discordId === msg.author.id ||
      target.discordId === this.zephyr.user.id
    )
      throw new ZephyrError.UnacceptableTradeTargetError();

    if (target.blacklisted)
      throw new ZephyrError.AccountBlacklistedOtherError();

    const refs = options.filter((v) => !v.includes("@"));
    if (!refs[0] || !refs[1])
      throw new ZephyrError.InvalidCardIdentifierTradeError();

    const traderCard = await CardService.getUserCardByIdentifier(refs[0]);
    if (traderCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(traderCard);

    const tradeeCard = await CardService.getUserCardByIdentifier(refs[1]);
    if (tradeeCard.discordId !== target.discordId)
      throw new ZephyrError.TradeeNotOwnerOfCardError(tradeeCard);

    const traderTags = await ProfileService.getTags(profile);
    const tradeeTags = await ProfileService.getTags(target);
    const embed = new MessageEmbed()
      .setAuthor(
        `Trade | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Really trade \`${traderCard.id.toString(
          36
        )}\` for \`${tradeeCard.id.toString(36)}\`?` +
          `\n\n__**${targetUser.username} receives:**__` +
          `\n${getDescriptions([traderCard], this.zephyr, traderTags)}` +
          `\n\n__**${msg.author.username} receives:**__` +
          `\n${getDescriptions([tradeeCard], this.zephyr, tradeeTags)}`
      );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      (userId === msg.author.id || userId === targetUser.id) &&
      emoji.id === this.zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 30000,
    });

    const confirmed: string[] = [];

    collector.on(
      "collect",
      async (_m: Message, _emoji: PartialEmoji, userId: string) => {
        if (confirmed.indexOf(userId) < 0) confirmed.push(userId);

        if (confirmed.length === 2) {
          const recheckTraderCard = await traderCard.fetch();
          if (recheckTraderCard.discordId !== msg.author.id) {
            await confirmation.edit({
              embed: embed.setFooter(
                `⚠️ ${recheckTraderCard.id.toString(36)} has switched owners.`
              ),
            });
            return;
          }

          const recheckTradeeCard = await tradeeCard.fetch();
          if (recheckTradeeCard.discordId !== target.discordId) {
            await confirmation.edit({
              embed: embed.setFooter(
                `⚠️ ${recheckTradeeCard.id.toString(36)} has switched owners.`
              ),
            });
            return;
          }

          await CardService.transferCardsToUser([traderCard], target);
          await CardService.transferCardsToUser([tradeeCard], profile);

          await AnticheatService.logTrade(
            profile,
            target,
            traderCard,
            tradeeCard,
            msg.guildID!
          );

          await confirmation.edit({
            embed: embed.setFooter(`🔄 Trade completed!`),
          });

          collector.stop();
          return;
        }
      }
    );

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
