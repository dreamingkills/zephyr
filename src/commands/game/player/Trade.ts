import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { ReactionCollector } from "eris-collector";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { VaultError } from "../../../structures/error/VaultError";
import { Zephyr } from "../../../structures/client/Zephyr";
import { AutotagService } from "../../../lib/database/services/game/AutotagService";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { QuestObjective } from "../../../structures/game/quest/QuestObjective";
import { QuestProgression } from "../../../structures/game/quest/QuestProgression";

export default class Trade extends BaseCommand {
  id = `rhinestone`;
  names = [`trade`];
  description = `Trades one of your cards for someone else's card.`;
  usage = [`$CMD$ <@mention> <your card> <their card>`];

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
      target.discordId === Zephyr.user.id
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

    if (traderCard.vaulted) throw new VaultError.CardInVaultError(traderCard);

    const traderCardIsInAlbum = await AlbumService.cardIsInAlbum(traderCard);
    if (traderCardIsInAlbum) throw new ZephyrError.CardInAlbumError(traderCard);

    const tradeeCard = await CardService.getUserCardByIdentifier(refs[1]);
    if (tradeeCard.discordId !== target.discordId)
      throw new ZephyrError.TradeeNotOwnerOfCardError(tradeeCard);

    if (tradeeCard.vaulted) throw new ZephyrError.CardVaultedError(tradeeCard);
    const tradeeCardIsInAlbum = await AlbumService.cardIsInAlbum(tradeeCard);
    if (tradeeCardIsInAlbum) throw new ZephyrError.CardInAlbumError(tradeeCard);

    const traderTags = await ProfileService.getTags(profile);
    const tradeeTags = await ProfileService.getTags(target);
    const embed = new MessageEmbed(`Trade`, msg.author).setDescription(
      `Really trade \`${traderCard.id.toString(
        36
      )}\` for \`${tradeeCard.id.toString(36)}\`?` +
        `\n\n__**${targetUser.username} receives:**__` +
        `\n${await getDescriptions([traderCard], traderTags)}` +
        `\n\n__**${msg.author.username} receives:**__` +
        `\n${await getDescriptions([tradeeCard], tradeeTags)}`
    );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      (user.id === msg.author.id || user.id === targetUser.id) &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    const confirmed: string[] = [];

    collector.on(
      "collect",
      async (_m: Message, _emoji: PartialEmoji, user: User) => {
        if (!confirmed.includes(user.id)) confirmed.push(user.id);

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

          await CardService.transferCardsToUser([traderCard], profile, target);
          await CardService.transferCardsToUser([tradeeCard], target, profile);

          const senderTags = await profile.getTags();
          const receiverTags = await target.getTags();

          if (senderTags.length > 0) {
            await AutotagService.autotag(
              profile,
              senderTags,
              await tradeeCard.fetch()
            );
          }
          if (receiverTags.length > 0) {
            await AutotagService.autotag(
              target,
              receiverTags,
              await traderCard.fetch()
            );
          }

          const progressableQuestsSender = await QuestGetter.checkAvailableQuestsForProgress(
            profile,
            QuestObjective.TRADE
          );
          const progressableQuestsReceiver = await QuestGetter.checkAvailableQuestsForProgress(
            target,
            QuestObjective.TRADE
          );

          if (progressableQuestsSender.length > 0) {
            const progressions = progressableQuestsSender.map((q) => {
              return { ...q, increment: 1 } as QuestProgression;
            });

            await QuestSetter.progressQuests(progressions, profile);
          }

          if (progressableQuestsReceiver.length > 0) {
            const progressions = progressableQuestsReceiver.map((q) => {
              return { ...q, increment: 1 } as QuestProgression;
            });

            await QuestSetter.progressQuests(progressions, target);
          }

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

      if (checkPermission(`manageMessages`, msg.channel))
        await confirmation.removeReactions();
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
