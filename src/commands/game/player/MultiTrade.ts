import { Message, PartialEmoji, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector, MessageCollector } from "eris-collector";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameUserCard } from "../../../structures/game/UserCard";
import { items } from "../../../assets/items.json";
import { BaseItem } from "../../../structures/game/Item";
import { GameDye } from "../../../structures/game/Dye";

type InteractableItem = { item: BaseItem; count: number };
type InteractableBits = { bits: number };
type InteractableCubits = { cubits: number };
type TradeItemResolvable =
  | GameUserCard
  | GameDye
  | InteractableBits
  | InteractableCubits
  | InteractableItem;

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

        const processed = await this.processItems(
          m.content.split(",").map((i) => i.trim())
        );

        if (processed.length === 0) return;

        for (let item of processed) {
          if (item instanceof GameUserCard) {
            if (item.discordId !== selectProfile.discordId) {
              await this.handleError(
                msg,
                new ZephyrError.NotOwnerOfCardError(item)
              );
              continue;
            }

            const cardInTrade = selectItems.filter(
              (t) =>
                t instanceof GameUserCard && t.id === (<GameUserCard>item).id
            )[0] as GameUserCard | undefined;

            if (cardInTrade) continue;
            selectItems.push(item);
            continue;
          } else if (this.isBitItem(item)) {
            if (item.bits > selectProfile.bits) {
              await this.handleError(
                msg,
                new ZephyrError.NotEnoughBitsError(
                  selectProfile.bits,
                  item.bits
                )
              );
              continue;
            }

            const bitsInTrade = selectItems.filter((i) =>
              this.isBitItem(i)
            )[0] as InteractableBits | undefined;

            if ((bitsInTrade?.bits || 0) + item.bits > selectProfile.bits) {
              await this.handleError(
                msg,
                new ZephyrError.NotEnoughBitsError(
                  selectProfile.bits,
                  item.bits
                )
              );
              continue;
            }

            if (!bitsInTrade) {
              selectItems.push({
                bits: item.bits,
              });
            } else {
              bitsInTrade.bits += item.bits;
            }
            continue;
          } else if (this.isCubitItem(item)) {
            if (item.cubits > selectProfile.cubits) {
              await this.handleError(
                msg,
                new ZephyrError.NotEnoughCubitsError(
                  selectProfile.cubits,
                  item.cubits
                )
              );
              continue;
            }

            const cubitsInTrade = selectItems.filter((i) =>
              this.isCubitItem(i)
            )[0] as InteractableCubits | undefined;

            if (
              (cubitsInTrade?.cubits || 0) + item.cubits >
              selectProfile.cubits
            ) {
              await this.handleError(
                msg,
                new ZephyrError.NotEnoughCubitsError(
                  selectProfile.cubits,
                  item.cubits
                )
              );
              continue;
            }

            if (!cubitsInTrade) {
              selectItems.push({
                cubits: item.cubits,
              });
            } else {
              cubitsInTrade.cubits += item.cubits;
            }
            continue;
          } else if (this.isInteractableItem(item)) {
            const itemInTrade = selectItems.filter(
              (i) =>
                this.isInteractableItem(i) &&
                i.item.id === (<InteractableItem>item).item.id
            )[0] as InteractableItem | undefined;

            try {
              const userItem = await ProfileService.getItem(
                selectProfile,
                item.item.id,
                item.item.name
              );

              if ((itemInTrade?.count || 0) + item.count > userItem.quantity) {
                await this.handleError(
                  msg,
                  new ZephyrError.NotEnoughOfItemError(item.item.name)
                );
                continue;
              }

              if (!itemInTrade) {
                selectItems.push(item);
              } else {
                itemInTrade.count += item.count;
              }
              continue;
            } catch {
              await this.handleError(
                msg,
                new ZephyrError.NoItemInInventoryError(item.item.name)
              );
              continue;
            }
          }
        }

        const rendered = this.renderInventory(
          isSender ? senderItems : recipientItems
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

  private async processItems(
    tradeItems: string[]
  ): Promise<TradeItemResolvable[]> {
    const cards = [];
    const baseItems = [];
    let bits, cubits;
    for (let item of tradeItems) {
      const split = item.split(" ");
      if (split.length === 1) {
        try {
          const getCard = await CardService.getUserCardByIdentifier(item);
          cards.push(getCard);
          continue;
        } catch {}
      }

      if (split.length === 2) {
        if (split[1] === "bits") {
          const amount = parseInt(split[0], 10);

          if (!isNaN(amount) && amount > 0) {
            bits = (bits || 0) + amount;
          }
          continue;
        }

        if (split[1] === "cubits") {
          const amount = parseInt(split[0], 10);

          if (!isNaN(amount) && amount > 0) {
            cubits = (cubits || 0) + amount;
          }
          continue;
        }
      }

      // Single Item Detection
      let amount = 1;
      let baseItem = items.filter(
        (i) =>
          i.name.toLowerCase() === item.toLowerCase() ||
          (i.aliases && i.aliases.indexOf(item.toLowerCase()) > -1)
      )[0];
      if (!baseItem) {
        const noNumber = item.split(" ").slice(1).join(" ").toLowerCase();
        const derivedAmount = parseInt(item.split(" ")[0]);
        if (isNaN(derivedAmount)) continue;

        amount = derivedAmount;

        baseItem = items.filter(
          (i) =>
            i.name.toLowerCase() === noNumber.toLowerCase() ||
            (i.aliases && i.aliases.indexOf(noNumber.toLowerCase()))
        )[0];
      }

      if (!baseItem) continue;
      baseItems.push({ item: baseItem, count: amount });
    }

    const total: TradeItemResolvable[] = [...cards, ...baseItems];
    if (bits) total.push({ bits });
    if (cubits) total.push({ cubits });

    return total;
  }

  private renderInventory(tradeItems: TradeItemResolvable[]): string {
    const cards = tradeItems.filter(
      (i) => i instanceof GameUserCard
    ) as GameUserCard[];

    const bits = (<InteractableBits>(
      tradeItems.filter((i) => this.isBitItem(i))[0]
    ))?.bits;

    const cubits = (<InteractableCubits>(
      tradeItems.filter((i) => this.isCubitItem(i))[0]
    ))?.cubits;

    const baseItems = tradeItems.filter((i) =>
      this.isInteractableItem(i)
    ) as InteractableItem[];

    const trueBaseItems: InteractableItem[] = [];

    for (let item of baseItems) {
      const findItem = trueBaseItems.find((i) => i.item.id === item.item.id);
      if (findItem) {
        findItem.count += item.count;
      } else {
        trueBaseItems.push({ ...item });
      }
    }

    return `\`\`\`diff\n- Unconfirmed -\n\n${
      bits ? `${bits.toLocaleString()} bits\n` : ``
    }${cubits ? `${cubits.toLocaleString()} cubits\n` : ``}${
      cards.length > 0
        ? cards.map((c) => c.id.toString(36)).join(", ") + `\n`
        : ``
    }${
      trueBaseItems.length > 0
        ? trueBaseItems.map((i) => `${i.count}x ${i.item.name}`).join(", ")
        : ``
    }\n\`\`\``;
  }

  private isInteractableItem(value: any): value is InteractableItem {
    return value.hasOwnProperty("item") && value.hasOwnProperty("count");
  }

  private isBitItem(value: any): value is InteractableBits {
    return value.hasOwnProperty("bits");
  }

  private isCubitItem(value: any): value is InteractableCubits {
    return value.hasOwnProperty("cubits");
  }
}
