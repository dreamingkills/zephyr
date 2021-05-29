import { Message, PartialEmoji, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector, MessageCollector } from "eris-collector";
import { processItems } from "../../../lib/command/multitrade/ProcessItems";
import { verifyMultitradeItems } from "../../../lib/command/multitrade/VerifyItems";
import { renderMultitradeInventory } from "../../../lib/command/multitrade/RenderInventory";
import { transferItems } from "../../../lib/command/multitrade/TransferItems";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { Logger } from "../../../lib/logger/Logger";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { QuestObjective } from "../../../structures/game/quest/QuestObjective";
import { QuestProgression } from "../../../structures/game/quest/QuestProgression";

export default class MultiTrade extends BaseCommand {
  id = `inhuman`;
  names = [`multitrade`, `mt`];
  description = `Initiates a multitrade.`;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    if (targetUser.id === msg.author.id)
      throw new ZephyrError.UnacceptableTradeTargetError();

    const targetProfile = await ProfileService.getProfile(targetUser.id);

    if (targetProfile.blacklisted)
      throw new ZephyrError.AccountBlacklistedOtherError();

    const tradeMessage = await this.send(
      msg.channel,
      `<@${targetUser.id}>, would you like to trade with **${msg.author.tag}**? Click ☑ to confirm.`
    );

    const requestConfirmed: boolean = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === targetUser.id && emoji.name === "☑";

      const collector = new ReactionCollector(Zephyr, tradeMessage, filter, {
        time: 15000,
        max: 1,
      });
      collector.on("error", (e: Error) => this.handleError(msg, msg.author, e));

      collector.on("collect", () => {
        res(true);
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") res(false);
      });

      await this.react(tradeMessage, "☑");
    });

    if (!requestConfirmed) {
      await this.edit(
        tradeMessage,
        `${tradeMessage.content}\n*This trade request has expired.*`
      );
      return;
    }

    if (checkPermission(`manageMessages`, msg.channel))
      await tradeMessage.removeReactions();

    const tradeInterfaceEmbed = new MessageEmbed(
      `Multi Trade`,
      msg.author
    ).setDescription(`\nExample message: \`100 bits, 33b9, heart sticker\``);

    tradeInterfaceEmbed.addFields([
      {
        name: `${msg.author.tag} — ${msg.author.id}`,
        value: `\`\`\`diff\n- Unconfirmed -\n \n \n \`\`\``,
        inline: true,
      },
      {
        name: `${targetUser.tag} — ${targetUser.id}`,
        value: `\`\`\`diff\n- Unconfirmed -\n \n \n \`\`\``,
        inline: true,
      },
    ]);

    await this.edit(tradeMessage, "", { embed: tradeInterfaceEmbed });

    await this.react(tradeMessage, "❌");
    await this.react(tradeMessage, "🔒");

    const [senderItems, recipientItems] = [[], []] as [
      TradeItemResolvable[],
      TradeItemResolvable[]
    ];

    const tradeConfirmed: boolean = await new Promise(async (res, _req) => {
      let [senderConfirmed, recipientConfirmed] = [false, false];
      let [senderAccepted, recipientAccepted] = [false, false];

      const messageFilter = (m: Message) =>
        [targetUser.id, msg.author.id].includes(m.author.id);
      const messageCollector = new MessageCollector(
        Zephyr,
        msg.channel,
        messageFilter,
        { time: 300000 }
      );

      messageCollector.on(
        "error",
        async (e: Error) => await this.handleError(msg, msg.author, e)
      );

      messageCollector.on("collect", async (m: Message) => {
        const isSender = this.isSender(msg.author, m.author.id);
        if ((isSender && senderConfirmed) || (!isSender && recipientConfirmed))
          return;

        const selectProfile = isSender ? profile : targetProfile;
        const selectItems = isSender ? senderItems : recipientItems;

        if (selectItems.length > 50) return;

        const processed = await processItems(
          m.content.split(",").map((i) => i.trim().toLowerCase())
        );

        if (processed.length === 0) return;

        await verifyMultitradeItems(
          m,
          isSender ? msg.author : targetUser,
          this.handleError,
          processed,
          await selectProfile.fetch(),
          selectItems
        );

        const rendered = renderMultitradeInventory(
          isSender ? senderItems : recipientItems,
          isSender ? senderConfirmed : recipientConfirmed,
          isSender ? senderAccepted : recipientAccepted
        );

        if (isSender) {
          tradeInterfaceEmbed.fields[0].value = rendered;
        } else {
          tradeInterfaceEmbed.fields[1].value = rendered;
        }
        await this.edit(tradeMessage, tradeInterfaceEmbed);
      });

      const reactionFilter = (_m: Message, emoji: PartialEmoji, user: User) =>
        [targetUser.id, msg.author.id].includes(user.id) &&
        ["❌", "🔒", "✅"].includes(emoji.name);

      const reactionCollector = new ReactionCollector(
        Zephyr,
        tradeMessage,
        reactionFilter,
        {
          time: 300000,
        }
      );

      reactionCollector.on("error", async (e: Error) => {
        Logger.error(e);
        await this.handleError(msg, msg.author, e);

        return;
      });

      reactionCollector.on(
        "collect",
        async (_m: Message, emoji: PartialEmoji, user: User) => {
          const isSender = this.isSender(msg.author, user.id);

          switch (emoji.name) {
            case "❌": {
              reactionCollector.stop();
              res(false);
              break;
            }
            case "🔒": {
              if (isSender) {
                senderConfirmed = true;
                const rendered = renderMultitradeInventory(
                  senderItems,
                  true,
                  false
                );
                tradeInterfaceEmbed.fields[0].value = rendered;
              } else {
                recipientConfirmed = true;
                const rendered = renderMultitradeInventory(
                  recipientItems,
                  true,
                  false
                );
                tradeInterfaceEmbed.fields[1].value = rendered;
              }
              await this.edit(tradeMessage, tradeInterfaceEmbed);

              if (senderConfirmed && recipientConfirmed)
                await this.react(tradeMessage, "✅");

              break;
            }
            case "✅": {
              if (!(senderConfirmed && recipientConfirmed)) break;

              if (isSender && senderConfirmed) {
                senderAccepted = true;
                const rendered = renderMultitradeInventory(
                  senderItems,
                  true,
                  true
                );
                tradeInterfaceEmbed.fields[0].value = rendered;
              } else if (!isSender && recipientConfirmed) {
                recipientAccepted = true;
                const rendered = renderMultitradeInventory(
                  recipientItems,
                  true,
                  true
                );
                tradeInterfaceEmbed.fields[1].value = rendered;
              }

              await this.edit(tradeMessage, tradeInterfaceEmbed);

              if (senderAccepted && recipientAccepted) {
                reactionCollector.stop();
                res(true);
              }
              break;
            }
          }
        }
      );

      messageCollector.on(
        "end",
        async (_collected: unknown, reason: string) => {
          reactionCollector.stop();
          if (reason === "time") res(false);
        }
      );

      reactionCollector.on(
        "end",
        async (_collected: unknown, reason: string) => {
          messageCollector.stop();
          if (reason === "time") res(false);
        }
      );
    });

    if (!tradeConfirmed) {
      await this.edit(
        tradeMessage,
        tradeInterfaceEmbed
          .setDescription(`This trade has been cancelled.`)
          .setColor(`C22727`)
      );
      return;
    }

    try {
      await verifyMultitradeItems(
        msg,
        msg.author,
        this.handleError,
        senderItems,
        await profile.fetch(),
        []
      );
      await verifyMultitradeItems(
        msg,
        targetUser,
        this.handleError,
        recipientItems,
        await targetProfile.fetch(),
        []
      );

      if (senderItems.length > 0 || recipientItems.length > 0) {
        if (senderItems.length > 0)
          await transferItems(senderItems, targetProfile, profile);
        if (recipientItems.length > 0)
          await transferItems(recipientItems, profile, targetProfile);

        const progressableQuestsSender = await QuestGetter.checkAvailableQuestsForProgress(
          profile,
          QuestObjective.TRADE
        );
        const progressableQuestsReceiver = await QuestGetter.checkAvailableQuestsForProgress(
          targetProfile,
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

          await QuestSetter.progressQuests(progressions, targetProfile);
        }

        await AnticheatService.logMultitrade(
          senderItems,
          recipientItems,
          profile,
          targetProfile
        );

        await this.edit(
          tradeMessage,
          tradeInterfaceEmbed
            .setFooter(`This trade has been completed.`)
            .setColor(`26BF30`)
        );
      }
    } catch (e) {
      Logger.error(e);
      await this.edit(
        tradeMessage,
        tradeInterfaceEmbed
          .setDescription(`This trade has been cancelled.`)
          .setColor(`C22727`)
      );
    }

    return;
  }

  private isSender(sender: User, find: string): boolean {
    return sender.id === find;
  }
}
