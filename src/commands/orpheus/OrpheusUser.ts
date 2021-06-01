import { Message, User } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { OrpheusService } from "../../lib/database/services/orpheus/OrpheusService";
import { OrpheusMultitrade } from "../../structures/orpheus/OrpheusMultitrade";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusUser extends BaseCommand {
  id = `battery`;
  names = ["ops_au"];
  usage = ["$CMD$", "$CMD$ [command/topic]"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (
      !Zephyr.config.moderators.includes(msg.author.id) &&
      !Zephyr.config.developers.includes(msg.author.id)
    )
      return;

    let target: User;
    let targetProfile: GameProfile;

    if (msg.mentions[0]) {
      target = msg.mentions[0];
      targetProfile = await ProfileService.getProfile(target.id);
    } else if (options[0]) {
      if (
        isNaN(parseInt(options[0])) ||
        options[0].length < 17 ||
        options[0].length > 18
      )
        throw new ZephyrError.InvalidSnowflakeError();

      const user = await Zephyr.fetchUser(options[0]);

      if (!user) throw new ZephyrError.UserNotFoundError();

      target = user;
      targetProfile = await ProfileService.getProfile(target.id);
    } else {
      target = msg.author;
      targetProfile = profile;
    }

    /*
        Trade Data
    */
    const trades = await OrpheusService.getTrades(target);

    const tradesReceived = trades.filter((t) => t.receiver === target.id)
      .length;
    const tradesSent = trades.filter((t) => t.sender === target.id).length;

    const tradeReceivedCount: { [key: string]: number } = {};
    const tradeSentCount: { [key: string]: number } = {};

    for (let trade of trades) {
      if (trade.sender === target.id) {
        tradeReceivedCount[trade.receiver] =
          tradeReceivedCount[trade.receiver] + 1 || 1;
      } else if (trade.receiver === target.id) {
        tradeSentCount[trade.sender] = tradeSentCount[trade.sender] + 1 || 1;
      }
    }

    const tradeReceivedTop = Object.entries(tradeReceivedCount)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);
    const tradeSentTop = Object.entries(tradeSentCount)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);

    /*
        Multitrade Data
    */
    const multitrades = await OrpheusService.getMultitrades(target);
    const uniqueMultitrades: OrpheusMultitrade[] = [];
    for (let trade of multitrades) {
      if (!uniqueMultitrades.find((t) => t.trade_uuid === trade.trade_uuid)) {
        uniqueMultitrades.push(trade);
      }
    }

    const multitradesReceived = multitrades.filter(
      (t) => t.receiver === target.id
    ).length;
    const multitradesSent = multitrades.filter((t) => t.sender === target.id)
      .length;

    const multitradeReceivedCount: { [key: string]: number } = {};
    const multitradeSentCount: { [key: string]: number } = {};

    for (let trade of multitrades) {
      if (trade.sender === target.id) {
        multitradeReceivedCount[trade.receiver] =
          multitradeReceivedCount[trade.receiver] + 1 || 1;
      } else if (trade.receiver === target.id) {
        multitradeSentCount[trade.sender] =
          multitradeSentCount[trade.sender] + 1 || 1;
      }
    }

    const multitradeReceivedTop = Object.entries(multitradeReceivedCount)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);
    const multitradeSentTop = Object.entries(multitradeSentCount)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);

    /*
        Claim Data
    */
    const claims = await OrpheusService.getClaims(target);

    const selfClaims = claims.filter(
      (c) => c.dropper === target.id || !c.dropper
    ).length;

    const claimCount: { [key: string]: number } = {};

    for (let claim of claims) {
      if (!claim.dropper || claim.dropper === target.id) continue;
      claimCount[claim.dropper] = claimCount[claim.dropper] + 1 || 1;
    }

    const topDroppers = Object.entries(claimCount)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);

    /*
        Drop Data
    */
    const drops = await OrpheusService.getDrops(target);

    const claimers: { [key: string]: number } = {};

    for (let drop of drops) {
      if (drop.claimer === target.id) continue;
      claimers[drop.claimer] = claimers[drop.claimer] + 1 || 1;
    }

    const topClaimers = Object.entries(claimers)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, 10);

    /*
        Bit Transactions
    */
    const bitTransactions = await OrpheusService.getBitTransactions(target);

    const transactionsReceived = bitTransactions.filter(
      (t) => t.recipient === target.id
    );
    const transactionsSent = bitTransactions.filter(
      (t) => t.giver === target.id
    );

    const bitsSent: {
      [key: string]: { bits: number; transactions: number };
    } = {};
    const bitsReceived: {
      [key: string]: { bits: number; transactions: number };
    } = {};

    for (let sent of transactionsSent) {
      if (bitsSent[sent.recipient]) {
        bitsSent[sent.recipient].bits += sent.amount;
        bitsSent[sent.recipient].transactions++;
      } else {
        bitsSent[sent.recipient] = { bits: sent.amount, transactions: 1 };
      }
    }

    for (let received of transactionsReceived) {
      if (bitsReceived[received.giver]) {
        bitsReceived[received.giver].bits += received.amount;
        bitsReceived[received.giver].transactions++;
      } else {
        bitsReceived[received.giver] = {
          bits: received.amount,
          transactions: 1,
        };
      }
    }

    const bitsReceivedTop = Object.entries(bitsReceived).slice(0, 10);
    const bitsSentTop = Object.entries(bitsSent).slice(0, 10);

    const embed = new MessageEmbed(`Orpheus`, msg.author)
      .setTitle(`Analysis - ${target.tag}`)
      .setDescription(
        `**Account Status**: ${
          targetProfile.blacklisted ? `` : `NOT `
        }BLACKLISTED, ${targetProfile.private ? `` : `NOT `} PRIVATE`
      )
      .addFields([
        {
          name: `💰 Bit Transactions`,
          value: `${transactionsReceived.length} received / ${
            transactionsSent.length
          } sent (${(
            transactionsSent.length / transactionsReceived.length
          ).toFixed(2)}:1)\n\nTop received:\n${bitsReceivedTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1].transactions}** transactions / **${
                  t[1].bits
                }** bits ${t[1].transactions > 20 ? `:warning` : ``}`
            )
            .join(`\n`)
            .slice(0, 1000)}\n\nTop sent: \n${bitsSentTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1].transactions}** transactions / **${
                  t[1].bits
                }** bits ${t[1].transactions > 20 ? `:warning` : ``}`
            )
            .join(`\n`)
            .slice(0, 1000)}`,
          inline: true,
        },
        {
          name: `\u200b`,
          value: `\u200b`,
          inline: true,
        },
        {
          name: `🔄 Trades`,
          value: `${tradesReceived} received / ${tradesSent} sent (${(
            tradesSent / tradesReceived
          ).toFixed(2)}:1)\n\nTop received:\n${tradeSentTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1]}** trades ${
                  t[1] > 20 ? `:warning:` : ``
                }`
            )
            .join(`\n`)
            .slice(0, 1000)}\n\nTop sent:\n${tradeReceivedTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1]}** trades ${
                  t[1] > 20 ? `:warning:` : ``
                }`
            )
            .join(`\n`)
            .slice(0, 1000)}`,
          inline: true,
        },
        {
          name: `🔀 Multitrades`,
          value: `${multitradesReceived} received / ${multitradesSent} sent (${(
            multitradesSent / multitradesReceived
          ).toFixed(2)}:1)\n\nTop received:\n${multitradeSentTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1]}** trades ${
                  t[1] > 20 ? `:warning:` : ``
                }`
            )
            .join(`\n`)
            .slice(0, 1000)}\n\nTop sent:\n${multitradeReceivedTop
            .map(
              (t) =>
                `— \`${t[0]}\` - **${t[1]}** trades ${
                  t[1] > 20 ? `:warning:` : ``
                }`
            )
            .join(`\n`)
            .slice(0, 1000)}`,
          inline: true,
        },

        {
          name: `\u200b`,
          value: `\u200b`,
          inline: true,
        },
        {
          name: `🖐️ Claims`,
          value: `${claims.length} claims / ${selfClaims} self/activity (${(
            selfClaims / claims.length
          ).toFixed(
            2
          )}:1)\n\nTop droppers (excl. self, activity):\n${topDroppers
            .map((t) => `— \`${t[0]}\` - **${t[1]}** drops`)
            .join(`\n`)
            .slice(0, 1000)}`,
          inline: true,
        },
        {
          name: `👊 Drops`,
          value: `${
            drops.length
          } drops\n\nTop claimers (excl. self):\n${topClaimers
            .map((t) => `— \`${t[0]}\` - **${t[1]}** claims`)
            .join(`\n`)
            .slice(0, 1000)}`,
          inline: true,
        },
        {
          name: `\u200b`,
          value: `\u200b`,
          inline: true,
        },
      ]);

    await this.send(msg.channel, embed);
  }
}
