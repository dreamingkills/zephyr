import { Guild, Message, PartialEmoji, TextChannel, User } from "eris";
import { GameDroppedCard } from "../structures/game/DroppedCard";
import { CardService } from "./database/services/game/CardService";
import { ReactionCollector } from "eris-collector";
import { GameProfile } from "../structures/game/Profile";
import { ProfileService } from "./database/services/game/ProfileService";
import { GameUserCard } from "../structures/game/UserCard";
import { Chance } from "chance";
import { Zephyr } from "../structures/client/Zephyr";
import { getTimeUntil } from "../lib/ZephyrUtils";
import dayjs from "dayjs";
import { GuildService } from "./database/services/guild/GuildService";
import { GameBaseCard } from "../structures/game/BaseCard";
import { AnticheatService } from "./database/services/meta/AnticheatService";

export abstract class CardSpawner {
  private static readonly emojis = ["1️⃣", "2️⃣", "3️⃣"];
  private static readonly timeout = 5000;
  private static readonly minSpawnThreshold = 100;
  private static readonly spawnThreshold = CardSpawner.minSpawnThreshold * 2;
  private static guildLevels: { [key: string]: number } = {};
  private static grabbing: Set<string> = new Set();

  static userCooldowns: Set<string> = new Set();
  static guildCooldowns: Set<string> = new Set();

  private static async fight(
    takers: Set<string>,
    card: GameDroppedCard,
    zephyr: Zephyr,
    frame: number,
    start: number,
    prefer?: GameProfile
  ): Promise<{ winner: GameProfile; card: GameUserCard }> {
    let winner;
    if (prefer && takers.has(prefer.discordId)) {
      winner = prefer;
    } else {
      const winnerId: string = new Chance().pickone(Array.from(takers));
      winner = await ProfileService.getProfile(winnerId);
    }
    const baseCard = zephyr.getCard(card.baseCardId);

    const now = Date.now();
    const newCard = await CardService.createNewUserCard(
      baseCard,
      winner,
      zephyr,
      0,
      now - start,
      prefer ? prefer : null,
      frame,
      takers.size
    );

    return { winner, card: newCard };
  }

  private static async dropCards(
    title: string,
    channel: TextChannel,
    cards: GameBaseCard[],
    zephyr: Zephyr,
    prefer?: GameProfile
  ): Promise<void> {
    const start = Date.now();
    const droppedCards: GameUserCard[] = [];

    for (let card of cards) {
      droppedCards.push(
        new GameUserCard({
          id: 0,
          serial_number: card.serialTotal + 1,
          card_id: card.id,
          discord_id: "0",
          original_owner: "0",
          wear: 0,
          frame_id: 1,
          frame_name: "",
          frame_url: "",
          dye_mask_url: "",
          dye_r: 185,
          dye_g: 185,
          dye_b: 185,
          tag_id: 0,
          claim_time: 0,
          original_wear: 0,
          fight_count: 0,
          dropper: "0",
          luck_coeff: 0,
        })
      );
    }

    const collage = await CardService.generateCardCollage(droppedCards, zephyr);
    const drop = await channel.createMessage(`${title}\n`, {
      file: collage,
      name: "collage.png",
    });
    const filter = (_m: Message, emoji: PartialEmoji, userID: string) =>
      this.emojis.includes(emoji.name) && userID !== channel.client.user.id;
    const collector = new ReactionCollector(channel.client, drop, filter, {
      time: 30000,
    });

    const finished = [false, false, false];
    const started = [false, false, false];
    const takers = [new Set(), new Set(), new Set()] as Set<string>[];
    const winners = new Set() as Set<string>;

    // This is so that we only notify people of their cooldown once.
    // It cuts down on spam.
    const warned = new Set() as Set<string>;

    collector.on(
      "collect",
      async (_: Message, emoji: PartialEmoji, userId: string) => {
        // If this card has already been claimed, ignore.
        const num = this.emojis.indexOf(emoji.name);
        if (finished[num]) return;

        if (this.grabbing.has(userId)) return;

        const profile = await ProfileService.getProfile(userId, true);

        // Do not allow blacklisted users to claim cards.
        if (profile.blacklisted) return;

        // Claim cooldown detection
        const now = dayjs(Date.now());
        const until = dayjs(profile.claimNext);
        if (until > now && !winners.has(profile.discordId)) {
          // Don't warn people more than once -- anti-spam
          if (!warned.has(profile.discordId)) {
            await channel.createMessage(
              `<@${userId}>, you must wait **${
                getTimeUntil(now, until) || `<1s`
              }** before claiming another card.`
            );
            warned.add(profile.discordId);
          }
          return;
        }

        // If the user has already attempted to claim a card from this set,
        // or has already won a card, ignore.
        if (
          takers.filter((t) => t.has(profile.discordId))[0] ||
          winners.has(profile.discordId)
        )
          return;

        takers[num].add(profile.discordId);
        this.grabbing.add(profile.discordId);

        if (started[num]) return;
        started[num] = true;

        setTimeout(async () => {
          finished[num] = true;

          const fight = await this.fight(
            takers[num],
            droppedCards[num],
            zephyr,
            droppedCards[num].frameId,
            start,
            prefer
          );
          winners.add(fight.winner.discordId);

          await AnticheatService.logClaim(
            fight.winner,
            prefer,
            fight.card,
            Date.now(),
            start,
            channel.guild.id
          );

          const countExl = takers[num].size - 1;

          for (let t of takers[num]) {
            this.grabbing.delete(t);
          }

          takers[num].clear();

          let message = "";

          if (countExl === 0 || prefer?.discordId === fight.winner.discordId) {
            message += `<@${fight.winner.discordId}> claimed `;
          } else {
            message += `<@${
              fight.winner.discordId
            }> fought off **${countExl}** ${
              countExl === 1 ? `person` : `people`
            } and claimed `;
          }

          const baseCard = zephyr.getCard(fight.card.baseCardId);

          message +=
            `\`${fight.card.id.toString(36)}\` **${baseCard.name}**` +
            (baseCard.subgroup ? ` (${baseCard.subgroup})` : ``) +
            `!`;

          switch (fight.card.wear) {
            case 0: {
              message += ` This card is **damaged**...`;
              break;
            }
            case 1: {
              message += ` It's in **poor** condition.`;
              break;
            }
            case 3: {
              message += ` It looks **good**.`;
              break;
            }
            case 4: {
              message += ` This card is looking **great**!`;
              break;
            }
            case 5: {
              message += ` Wow, this card is in **mint** condition!`;
              break;
            }
          }

          await ProfileService.setClaimTimestamp(
            fight.winner,
            now.add(10, "minute").format(`YYYY/MM/DD HH:mm:ss`)
          );

          await channel.createMessage(message);

          if (finished[0] && finished[1] && finished[2]) collector.stop();
        }, this.timeout);
      }
    );

    collector.on("end", async () => {
      try {
        await drop.delete();
      } catch {}
      return;
    });

    try {
      this.emojis.forEach((e) => drop.addReaction(e));
    } catch {}

    await CardService.incrementGenerated(cards);
    return;
  }

  public static async forceDrop(
    channel: TextChannel,
    cards: GameBaseCard[],
    zephyr: Zephyr
  ): Promise<void> {
    return await this.dropCards(
      `— **${cards.length} cards** are dropping due to server activity!`,
      channel,
      cards,
      zephyr
    );
  }

  public static async userDrop(
    channel: TextChannel,
    cards: GameBaseCard[],
    profile: GameProfile,
    zephyr: Zephyr
  ): Promise<void> {
    return await this.dropCards(
      `— <@${profile.discordId}> is dropping **${cards.length} cards**!`,
      channel,
      cards,
      zephyr,
      profile
    );
  }

  public static async activityDrop(
    channel: TextChannel,
    zephyr: Zephyr
  ): Promise<void> {
    const cards = zephyr.getRandomCards(3);
    await this.dropCards(
      "— **3 cards** are dropping due to server activity!",
      channel,
      cards,
      zephyr
    );
  }

  public static async processMessage(guild: Guild, user: User, zephyr: Zephyr) {
    if (this.userCooldowns.has(user.id) || this.guildCooldowns.has(guild.id))
      // If they're on cooldown, ignore.
      return;

    if (!this.guildLevels[guild.id]) {
      this.guildLevels[guild.id] = 1;
      return;
    } else {
      this.guildLevels[guild.id]++;
    }

    this.guildCooldowns.add(guild.id);
    this.userCooldowns.add(user.id);
    setTimeout(() => {
      this.userCooldowns.delete(user.id);
    }, 3000);
    setTimeout(() => {
      this.guildCooldowns.delete(guild.id);
    }, 1500);

    if (this.guildLevels[guild.id] >= this.minSpawnThreshold) {
      this.guildLevels[guild.id] = 0;
      let rand = [false, true][Math.floor(Math.random() * 2)];
      if (this.guildLevels[guild.id] >= this.spawnThreshold) {
        rand = true;
      }
      if (!rand) return;

      const channelId = await GuildService.getDropChannel(guild.id);

      if (!channelId) return;

      const channel = guild.channels.find(
        (c) => c.id === channelId
      ) as TextChannel;

      if (channel.permissionsOf(zephyr.user.id).json["sendMessages"])
        await this.activityDrop(channel, zephyr);
    }
  }
}
