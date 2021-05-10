import { Guild, Message, PartialEmoji, TextChannel, User } from "eris";
import { CardService } from "./database/services/game/CardService";
import { ReactionCollector } from "eris-collector";
import { GameProfile } from "../structures/game/Profile";
import { ProfileService } from "./database/services/game/ProfileService";
import { GameUserCard, MockUserCard } from "../structures/game/UserCard";
import { Chance } from "chance";
import { getTimeUntil } from "../lib/utility/time/TimeUtils";
import dayjs from "dayjs";
import { GuildService } from "./database/services/guild/GuildService";
import { GameBaseCard } from "../structures/game/BaseCard";
import { AnticheatService } from "./database/services/meta/AnticheatService";
import { createMessage } from "./discord/message/createMessage";
// import { addReaction } from "./discord/message/addReaction";
import { checkPermission } from "./ZephyrUtils";
import { AutotagService } from "./database/services/game/AutotagService";
import { deleteMessage } from "./discord/message/deleteMessage";
import { Frames } from "./cosmetics/Frames";
import { Logger } from "./logger/Logger";
import { Zephyr } from "../structures/client/Zephyr";

class DropHandler {
  private readonly emojis = ["1️⃣", "2️⃣", "3️⃣"];
  private readonly timeout = 5000;
  private readonly minSpawnThreshold = 250;
  private readonly spawnThreshold = this.minSpawnThreshold * 2;
  private guildLevels: { [key: string]: number } = {};
  private grabbing: Set<string> = new Set();

  userCooldowns: Set<string> = new Set();
  guildCooldowns: Set<string> = new Set();

  private async fight(
    takers: Set<string>,
    card: MockUserCard,
    prefer?: GameProfile
  ): Promise<{ winner: GameProfile; card: GameUserCard }> {
    let winner;
    if (prefer && takers.has(prefer.discordId)) {
      winner = prefer;
    } else {
      const winnerId: string = new Chance().pickone(Array.from(takers));
      winner = await ProfileService.getProfile(winnerId);
    }

    const newCard = await CardService.createNewUserCard(card.baseCard, winner);

    return { winner, card: newCard };
  }

  private async dropCards(
    title: string,
    channel: TextChannel,
    cards: GameBaseCard[],
    prefer?: GameProfile
  ): Promise<void> {
    const start = Date.now();
    const droppedCards: MockUserCard[] = [];
    let deleted = false;

    for (let card of cards) {
      droppedCards.push(
        new MockUserCard({
          id: 0,
          baseCard: card,
          frame: Frames.getFrameById(1)!,
          serialNumber: card.serialTotal + 1,
          dye: {
            r: -1,
            g: -1,
            b: -1,
          },
        })
      );
    }

    const collage = await CardService.generateCardCollage(droppedCards);

    const drop = await createMessage(channel, `${title}\n`, {
      files: [
        {
          file: collage,
          name: "collage.png",
        },
      ],
    });

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      this.emojis.includes(emoji.name) && user.id !== channel.client.user.id;

    const collector = new ReactionCollector(channel.client, drop, filter);

    collector.on("error", async (e: Error) => {
      Logger.error(`${e}`);

      await createMessage(channel, `An unexpected error occurred.`);
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
      async (_: Message, emoji: PartialEmoji, user: User) => {
        // If this card has already been claimed, ignore.
        const num = this.emojis.indexOf(emoji.name);
        if (finished[num]) return;
        
        if (this.grabbing.has(user.id)) return;

        const profile = await ProfileService.getProfile(user.id, true);

        // Do not allow blacklisted users to claim cards.
        if (profile.blacklisted) return;

        // Claim cooldown detection
        const now = dayjs(Date.now());
        const until = dayjs(profile.claimNext);
        if (until > now && !winners.has(profile.discordId)) {
          // Don't warn people more than once -- anti-spam
          if (Zephyr.flags.claimAlerts) {
            if (!warned.has(profile.discordId)) {
              await createMessage(
                channel,
                `<@${user.id}>, you must wait **${getTimeUntil(
                  now,
                  until
                )}** before claiming another card.`
              );
              warned.add(profile.discordId);
            }
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
            prefer
          );
          winners.add(fight.winner.discordId);

          const countExl = takers[num].size - 1;

          await AnticheatService.logClaim(
            fight.winner,
            prefer,
            fight.card,
            Date.now(),
            start,
            channel.guild.id,
            countExl,
            Date.now() - start
          );

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

          const baseCard = Zephyr.getCard(fight.card.baseCardId)!;

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

          /*
              Autotag
          */
          const tags = await ProfileService.getTags(fight.winner);
          if (tags.length > 0) {
            const autotag = await AutotagService.autotag(
              fight.winner,
              tags,
              fight.card
            );

            if (autotag.tag) {
              const targetTag = tags.find((t) => t.id === autotag.tag);

              if (!targetTag) {
                Logger.error(
                  `Unexpected autotag behavior: targetTag undefined where Tag ${autotag.tag}`
                );
              } else {
                message += ` It was autotagged ${targetTag.emoji} **${targetTag.name}**.`;
              }
            }
          }

          await createMessage(channel, message);

          if (finished[0] && finished[1] && finished[2]) collector.stop();
        }, this.timeout);
      }
    );

    collector.on("end", async () => {
      if (!deleted) {
        deleted = true;
        await deleteMessage(drop);
      }

      return;
    });

    await CardService.incrementGenerated(cards);

    /*
    await addReaction(drop, this.emojis[0]);
    await addReaction(drop, this.emojis[1]);
    await addReaction(drop, this.emojis[2]);
    */

    setTimeout(() => collector.stop(), 30000);

    return;
  }

  public async forceDrop(
    channel: TextChannel,
    cards: GameBaseCard[]
  ): Promise<void> {
    return await this.dropCards(
      `— **${cards.length} cards** are dropping due to server activity!\n**NOTICE**: You need to manually react :one:, :two:, or :three: temporarily due to poor performance.`,
      channel,
      cards
    );
  }

  public async userDrop(
    channel: TextChannel,
    cards: GameBaseCard[],
    profile: GameProfile
  ): Promise<void> {
    return await this.dropCards(
      `— <@${profile.discordId}> is dropping **${cards.length} cards**!\n**NOTICE**: You need to manually react :one:, :two:, or :three: temporarily due to poor performance.`,
      channel,
      cards,
      profile
    );
  }

  public async activityDrop(channel: TextChannel): Promise<void> {
    const cards = Zephyr.getRandomCards(3);
    await this.dropCards(
      "— **3 cards** are dropping due to server activity!\n**NOTICE**: You need to manually react :one:, :two:, or :three: temporarily due to poor performance.",
      channel,
      cards
    );
  }

  public async processMessage(guild: Guild, user: User) {
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
      let rand = [false, true][Math.floor(Math.random() * 2)];
      if (this.guildLevels[guild.id] >= this.spawnThreshold) {
        rand = true;
      }
      if (!rand) return;

      this.guildLevels[guild.id] = 0;
      const channelId = await GuildService.getDropChannel(guild.id);

      if (!channelId) return;

      const channel = guild.channels.find(
        (c) => c.id === channelId
      ) as TextChannel;

      const reactPermission = checkPermission(`addReactions`, channel);
      const messagePermission = checkPermission(`addReactions`, channel);
      if (!reactPermission || !messagePermission) return;

      if (Zephyr.flags.drops) await this.activityDrop(channel);
    }
  }
}

export const CardSpawner = new DropHandler();
