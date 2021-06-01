import { Button, Guild, TextChannel, User } from "eris";
import { CardService } from "./database/services/game/CardService";
import { GameProfile } from "../structures/game/Profile";
import { ProfileService } from "./database/services/game/ProfileService";
import { MockUserCard } from "../structures/game/UserCard";
import { getTimeUntil } from "../lib/utility/time/TimeUtils";
import dayjs from "dayjs";
import { GuildService } from "./database/services/guild/GuildService";
import { GameBaseCard } from "../structures/game/BaseCard";
import { AnticheatService } from "./database/services/meta/AnticheatService";
import { checkPermission } from "./ZephyrUtils";
import { AutotagService } from "./database/services/game/AutotagService";
import { Frames } from "./cosmetics/Frames";
import { Logger } from "./logger/Logger";
import { Zephyr } from "../structures/client/Zephyr";
import { QuestObjective } from "../structures/game/quest/QuestObjective";
import { QuestProgression } from "../structures/game/quest/QuestProgression";
import { QuestGetter } from "./database/sql/game/quest/QuestGetter";
import { QuestSetter } from "./database/sql/game/quest/QuestSetter";
import { AnyComponentButton, MessageInteractionContext } from "slash-create";

class DropHandler {
  // private readonly emojis = ["1️⃣", "2️⃣", "3️⃣"];
  // private readonly timeout = 5000;
  private readonly minSpawnThreshold = 250;
  private readonly spawnThreshold = this.minSpawnThreshold * 2;
  private guildLevels: { [key: string]: number } = {};
  // private grabbing: Set<string> = new Set();

  userCooldowns: Set<string> = new Set();
  guildCooldowns: Set<string> = new Set();

  public activeDrops: Map<
    string,
    {
      cards: (GameBaseCard & { claimed: boolean })[];
      dropper: GameProfile | undefined;
      timestamp: number;
    }
  > = new Map();

  /*private async fight(
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
  }*/

  private async dropCards(
    title: string,
    channel: TextChannel,
    cards: GameBaseCard[],
    prefer?: GameProfile
  ): Promise<void> {
    const start = Date.now();
    const droppedCards: MockUserCard[] = [];
    // let deleted = false;

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

    const drop = await channel.createMessage(
      {
        content: `${title}\n`,
        components: [
          {
            type: 1,
            components: this.generateButtons(
              cards.map((c) => {
                return { ...c, claimed: false };
              })
            ),
          },
        ],
      },
      { file: collage, name: `collage.png` }
    );

    this.activeDrops.set(drop.id, {
      cards: cards.map((c) => {
        return { ...c, claimed: false };
      }),
      dropper: prefer,
      timestamp: start,
    });

    setTimeout(async () => {
      await drop.delete();
    }, 30000);

    setTimeout(async () => {
      this.activeDrops.delete(drop.id);
    }, 900000);

    /*const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
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

          const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
            fight.winner,
            QuestObjective.CLAIM_CARD
          );

          if (progressableQuests.length > 0) {
            const progressions = progressableQuests.map((q) => {
              return { ...q, increment: 1 } as QuestProgression;
            });

            await QuestSetter.progressQuests(progressions, profile);
          }

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
          * /
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
    * /

    setTimeout(() => collector.stop(), 30000);
    */
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
    profile: GameProfile,
    boosted: boolean
  ): Promise<void> {
    return await this.dropCards(
      `— <@${profile.discordId}> is dropping **${cards.length} cards**!${
        boosted ? ` *This drop is boosted!* :sparkles:` : ``
      }`,
      channel,
      cards,
      profile
    );
  }

  public async activityDrop(channel: TextChannel): Promise<void> {
    const cards = Zephyr.getRandomCards(3);
    await this.dropCards(
      `— **${cards.length} cards** are dropping due to server activity!`,
      channel,
      cards
    );
  }

  public async processMessage(guild: Guild, user: User) {
    if (this.userCooldowns.has(user.id) || this.guildCooldowns.has(guild.id))
      // If they're on cooldown, ignore.
      return;

    if (Zephyr.maintenance.enabled) return;

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

  public async handleClaim(
    dropId: string,
    button: 1 | 2 | 3,
    context: MessageInteractionContext
  ): Promise<void> {
    const drop = CardSpawner.activeDrops.get(dropId);

    if (!drop) {
      Logger.error(
        `[Drop ID: ${dropId}] Claim failed, drop is undefined in map!`
      );

      await context.send(
        `An error occurred attempting to claim this card (undefined in map).`
      );
      return;
    }

    if (
      drop.timestamp + 5000 > Date.now() &&
      drop.dropper?.discordId !== context.user.id
    ) {
      await context.send(
        `Hold up! You need to wait **${(
          (drop.timestamp + 5000 - Date.now()) /
          1000
        ).toFixed(
          2
        )}** seconds before claiming from this drop to allow for the dropper to claim a card.`,
        { ephemeral: true }
      );

      return;
    }

    const profile = await ProfileService.getProfile(context.user.id);

    const now = dayjs(Date.now());
    const until = dayjs(profile.claimNext);

    if (until > now) {
      await context.send(
        `<@${context.user.id}>, you must wait **${getTimeUntil(
          now,
          until
        )}** before claiming another card.`,
        { ephemeral: true }
      );

      return;
    }

    const pickedCard = drop.cards[button - 1];

    if (pickedCard.claimed) {
      await context.send(
        `Sorry, but **${pickedCard.group || `Soloist`}** ${pickedCard.name}${
          pickedCard.subgroup ? ` **(${pickedCard.subgroup})**` : ``
        } has already been claimed.`,
        { ephemeral: true }
      );

      return;
    }

    pickedCard.claimed = true;

    const newCard = await CardService.createNewUserCard(pickedCard, profile);

    await ProfileService.setClaimTimestamp(
      profile,
      dayjs().add(10, `minute`).format(`YYYY/MM/DD HH:mm:ss`)
    );

    const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
      profile,
      QuestObjective.CLAIM_CARD
    );

    if (progressableQuests.length > 0) {
      const progressions = progressableQuests.map((q) => {
        return { ...q, increment: 1 } as QuestProgression;
      });

      await QuestSetter.progressQuests(progressions, profile);
    }

    await AnticheatService.logClaim(
      profile,
      drop.dropper,
      newCard,
      Date.now(),
      drop.timestamp,
      context.guildID!,
      0,
      Date.now() - drop.timestamp
    );

    let claimMessage = `<@${context.user.id}> claimed \`${newCard.id.toString(
      36
    )}\` **${pickedCard.group || `Soloist`}** ${pickedCard.name} **(${
      pickedCard.subgroup
    })**!`;

    /*
    Autotag
    */
    const tags = await ProfileService.getTags(profile);
    if (tags.length > 0) {
      const autotag = await AutotagService.autotag(profile, tags, newCard);

      if (autotag.tag) {
        const targetTag = tags.find((t) => t.id === autotag.tag);

        if (!targetTag) {
          Logger.error(
            `Unexpected autotag behavior: targetTag undefined where Tag ${autotag.tag}`
          );
        } else {
          claimMessage += ` It was autotagged ${targetTag.emoji} **${targetTag.name}**.`;
        }
      }
    }

    await CardService.incrementGenerated(drop.cards);

    switch (newCard.wear) {
      case 0: {
        claimMessage += ` This card is **damaged**...`;
        break;
      }
      case 1: {
        claimMessage += ` It's in **poor** condition.`;
        break;
      }
      case 3: {
        claimMessage += ` It looks **good**.`;
        break;
      }
      case 4: {
        claimMessage += ` This card is looking **great**!`;
        break;
      }
      case 5: {
        claimMessage += ` Wow, this card is in **mint** condition!`;
        break;
      }
    }

    if (newCard.unusual)
      claimMessage += ` :sparkles: **Something is unusual about this card...**`;

    await context.send(claimMessage);

    return;
  }

  public generateButtons(
    cards: (GameBaseCard & { claimed: boolean })[]
  ): Button[] {
    return [
      {
        type: 2,
        custom_id: `drop1`,
        style: 1,
        label: `${cards[0].name}`,
        disabled: cards[0].claimed,
      },
      {
        type: 2,
        custom_id: `drop2`,
        style: 1,
        label: `${cards[1].name}`,
        disabled: cards[1].claimed,
      },
      {
        type: 2,
        custom_id: `drop3`,
        style: 1,
        label: `${cards[2].name}`,
        disabled: cards[2].claimed,
      },
    ];
  }

  public generateComponentButtons(
    cards: (GameBaseCard & { claimed: boolean })[]
  ): AnyComponentButton[] {
    return [
      {
        type: 2,
        custom_id: `drop1`,
        style: 1,
        label: `${cards[0].name}`,
        disabled: cards[0].claimed,
      },
      {
        type: 2,
        custom_id: `drop2`,
        style: 1,
        label: `${cards[1].name}`,
        disabled: cards[1].claimed,
      },
      {
        type: 2,
        custom_id: `drop3`,
        style: 1,
        label: `${cards[2].name}`,
        disabled: cards[2].claimed,
      },
    ];
  }
}

export const CardSpawner = new DropHandler();
