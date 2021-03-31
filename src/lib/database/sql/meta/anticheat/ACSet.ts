import dayjs from "dayjs";
import { DB, DBClass } from "../../..";
import { GameItem } from "../../../../../structures/game/Item";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { Chance } from "chance";
import { getCurrentTimestamp } from "../../../../utility/time/TimeUtils";
import { processMultitradeLogs } from "../../../../command/multitrade/ProcessLogs";
import { Message } from "eris";

export abstract class ACSet extends DBClass {
  public static async logGift(
    giver: GameProfile,
    recipient: GameProfile,
    cards: GameUserCard[],
    guildId: string
  ): Promise<void> {
    const values = [];

    for (let card of cards) {
      values.push(
        `(${DB.connection.escape(giver.discordId)}, ${DB.connection.escape(
          recipient.discordId
        )}, ${DB.connection.escape(card.id)}, ${DB.connection.escape(
          guildId
        )}, ${DB.connection.escape(getCurrentTimestamp())})`
      );
    }

    await DB.query(
      `INSERT INTO gift (giver, recipient, card_id, guild_id, gift_time) VALUES ${values.join(
        ", "
      )};`
    );
    return;
  }

  public static async logClaim(
    claimer: GameProfile,
    dropper: GameProfile | undefined,
    card: GameUserCard,
    claimTime: number,
    dropTime: number,
    guildId: string,
    fightCount: number,
    claimedAfter: number
  ): Promise<void> {
    const formattedClaimTimestamp = dayjs(claimTime).format(
      `YYYY/MM/DD HH:mm:ss`
    );
    const formattedDropTimestamp = dayjs(dropTime).format(
      `YYYY/MM/DD HH:mm:ss`
    );

    if (dropper) {
      await DB.query(
        `
        INSERT INTO
          claim (claimer, dropper, card_id, guild_id, claim_time, drop_time, fight_count, wear, claimed_after)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          claimer.discordId,
          dropper.discordId,
          card.id,
          guildId,
          formattedClaimTimestamp,
          formattedDropTimestamp,
          fightCount,
          card.wear,
          claimedAfter,
        ]
      );
    } else {
      await DB.query(
        `INSERT INTO claim (claimer, card_id, guild_id, claim_time, drop_time) VALUES (?, ?, ?, ?, ?);`,
        [
          claimer.discordId,
          card.id,
          guildId,
          formattedClaimTimestamp,
          formattedDropTimestamp,
        ]
      );
    }
    return;
  }

  public static async logBitTransaction(
    giver: GameProfile,
    recipient: GameProfile,
    amount: number,
    guildId: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO bit_transaction (giver, recipient, amount, guild_id, transaction_time) VALUES (?, ?, ?, ?, ?);`,
      [
        giver.discordId,
        recipient.discordId,
        amount,
        guildId,
        getCurrentTimestamp(),
      ]
    );
    return;
  }

  public static async logItemTransaction(
    giver: GameProfile,
    recipient: GameProfile,
    items: GameItem[],
    guildId: string
  ): Promise<void> {
    const values = [];

    for (let item of items) {
      values.push(
        `(${DB.connection.escape(giver.discordId)}, ${DB.connection.escape(
          recipient.discordId
        )}, ${DB.connection.escape(item.itemId)}, ${DB.connection.escape(
          guildId
        )}, ${DB.connection.escape(getCurrentTimestamp())})`
      );
    }

    await DB.query(
      `INSERT INTO item_transaction (giver, recipient, item_id, guild_id, transaction_time) VALUES ${values.join(
        ", "
      )};`
    );
    return;
  }

  public static async logTrade(
    sender: GameProfile,
    receiver: GameProfile,
    senderCard: GameUserCard,
    receiverCard: GameUserCard,
    guildId: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO trade (sender, receiver, sender_card_id, receiver_card_id, guild_id, trade_time) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        sender.discordId,
        receiver.discordId,
        senderCard.id,
        receiverCard.id,
        guildId,
        getCurrentTimestamp(),
      ]
    );
    return;
  }

  public static async logVote(
    voter: GameProfile,
    weekend: boolean
  ): Promise<void> {
    await DB.query(
      `INSERT INTO vote (voter, vote_time, weekend) VALUES (?, ?, ?);`,
      [voter.discordId, getCurrentTimestamp(), weekend]
    );
    return;
  }

  public static async logMultitrade(
    senderItems: TradeItemResolvable[],
    receiverItems: TradeItemResolvable[],
    sender: GameProfile,
    receiver: GameProfile
  ): Promise<void> {
    const formattedTimestamp = getCurrentTimestamp();
    const uuid = new Chance().guid();

    const processed = [
      ...processMultitradeLogs(
        senderItems,
        sender,
        receiver,
        uuid,
        formattedTimestamp
      ),
      ...processMultitradeLogs(
        receiverItems,
        receiver,
        sender,
        uuid,
        formattedTimestamp
      ),
    ];

    await DB.query(
      `INSERT INTO multitrade (trade_uuid, sender, receiver, item_type, item_value, quantity, trade_time) VALUES ${processed.join(
        ", "
      )};`
    );
    return;
  }

  public static async logBurn(
    profile: GameProfile,
    cards: GameUserCard[]
  ): Promise<void> {
    const formattedTimestamp = getCurrentTimestamp();

    const values = [];

    for (let card of cards) {
      values.push(
        `(${DB.connection.escape(profile.discordId)}, ${DB.connection.escape(
          card.id
        )}, ${DB.connection.escape(formattedTimestamp)})`
      );
    }

    await DB.query(
      `INSERT INTO burn (discord_id, card_id, burn_time) VALUES ${values.join(
        `, `
      )}`
    );

    return;
  }

  public static async logCommand(
    commandId: string,
    message: Message,
    parameters: string,
    error: boolean
  ): Promise<void> {
    await DB.query(
      `INSERT INTO command_use (command_id, discord_id, parameters, guild_id, channel_id, message_id, error) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        commandId,
        message.author.id,
        parameters,
        message.guildID || null!,
        message.channel.id,
        message.id,
        error,
      ]
    );

    return;
  }
}
