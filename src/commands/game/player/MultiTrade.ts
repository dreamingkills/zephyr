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

export default class MultiTrade extends BaseCommand {
  names = ["multitrade", "mt"];
  description = "Initiates a multitrade.";
  allowDm = true;
  developerOnly = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const targetProfile = await ProfileService.getProfile(targetUser.id);

    const tradeMessage = await this.send(
      msg.channel,
      `<@${targetUser.id}>, would you like to trade with **${msg.author.tag}**? Click ☑ to confirm.`
    );

    const requestConfirmed: boolean = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
        userId === targetUser.id && emoji.name === "☑";
      const collector = new ReactionCollector(
        this.zephyr,
        tradeMessage,
        filter,
        { time: 5000, max: 1 }
      );
      collector.on("error", (e: Error) => this.handleError(msg, e));

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

    try {
      await tradeMessage.removeReactions();
    } catch {}

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
    await this.react(tradeMessage, "☑");

    const [senderItems, recipientItems] = [[], []] as [
      TradeItemResolvable[],
      TradeItemResolvable[]
    ];

    const tradeConfirmed: boolean = await new Promise(async (res, _req) => {
      let [senderConfirmed, recipientConfirmed] = [false, false];
      let [senderAccepted, recipientAccepted] = [false, false];

      const messageFilter = (m: Message) =>
        [targetUser.id, msg.author.id].indexOf(m.author.id) > -1;
      const messageCollector = new MessageCollector(
        this.zephyr,
        msg.channel,
        messageFilter,
        { time: 300000 }
      );

      messageCollector.on(
        "error",
        async (e: Error) => await this.handleError(msg, e)
      );

      messageCollector.on("collect", async (m: Message) => {
        const isSender = this.isSender(msg.author, m.author.id);

        const selectProfile = isSender ? profile : targetProfile;
        const selectItems = isSender ? senderItems : recipientItems;

        const processed = await processItems(
          m.content.split(",").map((i) => i.trim())
        );

        if (processed.length === 0) return;

        await verifyMultitradeItems(
          msg,
          this.handleError,
          processed,
          selectProfile,
          selectItems
        );

        const rendered = renderMultitradeInventory(
          isSender ? senderItems : recipientItems,
          isSender ? senderConfirmed : recipientConfirmed
        );

        if (isSender) {
          tradeInterfaceEmbed.fields[0].value = rendered;
        } else {
          tradeInterfaceEmbed.fields[1].value = rendered;
        }
        await this.edit(tradeMessage, tradeInterfaceEmbed);
      });

      const reactionFilter = (
        _m: Message,
        emoji: PartialEmoji,
        userId: string
      ) =>
        [targetUser.id, msg.author.id].indexOf(userId) > -1 &&
        ["❌", "🔒", "☑"].indexOf(emoji.name) > -1;
      const reactionCollector = new ReactionCollector(
        this.zephyr,
        tradeMessage,
        reactionFilter,
        {
          time: 300000,
        }
      );

      reactionCollector.on(
        "error",
        async (e: Error) => await this.handleError(msg, e)
      );

      reactionCollector.on(
        "collect",
        async (_m: Message, emoji: PartialEmoji, userId: string) => {
          const isSender = this.isSender(msg.author, userId);

          switch (emoji.name) {
            case "❌": {
              reactionCollector.stop();
              res(false);
              break;
            }
            case "🔒": {
              if (isSender) {
                senderConfirmed = true;
              } else recipientConfirmed = true;
              break;
            }
            case "☑": {
              if (!(senderConfirmed && recipientConfirmed)) break;

              if (isSender) {
                senderAccepted = true;
              } else recipientAccepted = true;

              if (senderAccepted && recipientAccepted) {
                reactionCollector.stop();
                res(true);
              }
              break;
            }
          }
        }
      );

      messageCollector.on("end", async (_collected: any, reason: string) => {
        reactionCollector.stop();
        if (reason === "time") res(false);
      });

      reactionCollector.on("end", async (_collected: any, reason: string) => {
        messageCollector.stop();
        if (reason === "time") res(false);
      });
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

    return;
  }

  private isSender(sender: User, find: string): boolean {
    return sender.id === find;
  }
}