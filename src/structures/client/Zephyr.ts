import chalk from "chalk";
import stripAnsi from "strip-ansi";
import {
  Client,
  Guild,
  Message,
  PrivateChannel,
  TextChannel,
  User,
} from "eris";
import config from "../../../config.json";
import { CommandLib } from "../../lib/command/CommandLib";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { GameBaseCard } from "../game/BaseCard";
import { CardService } from "../../lib/database/services/game/CardService";
import { FontLoader } from "../../lib/FontLoader";
import { checkPermission, isDeveloper } from "../../lib/ZephyrUtils";
import { MessageEmbed } from "./RichEmbed";
import { Chance } from "chance";
import { CardSpawner } from "../../lib/CardSpawner";
import { GameWishlist } from "../game/Wishlist";
import { DMHandler } from "../../lib/DMHandler";
import { WebhookListener } from "../../webhook";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { AnticheatService } from "../../lib/database/services/meta/AnticheatService";
import dblapi from "dblapi.js";
import { createMessage } from "../../lib/discord/message/createMessage";
import dayjs from "dayjs";
import { GameIdol } from "../game/Idol";
import { StatsD } from "../../lib/StatsD";
import { Stickers } from "../../lib/cosmetics/Stickers";
import { Frames } from "../../lib/cosmetics/Frames";
import { Backgrounds } from "../../lib/cosmetics/Backgrounds";
import { Shop } from "../../lib/shop/Shop";
import { Logger, loggerSettings } from "../../lib/logger/Logger";
import { Quests } from "../../lib/quest/Quest";
import { QuestGetter } from "../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../lib/database/sql/game/quest/QuestSetter";
import { QuestObjective } from "../game/quest/QuestObjective";
import { QuestProgression } from "../game/quest/QuestProgression";
import { SlashCreator, GatewayServer } from "slash-create";
import path from "path";

class ZephyrClient extends Client {
  commandLib = new CommandLib();
  readonly config: typeof config;
  chance = new Chance();
  private prefixes: { [guildId: string]: string } = {};
  private cards: { [cardId: number]: GameBaseCard } = {};

  private idols: { [id: number]: GameIdol } = {};

  private errors: number = 0;

  onCooldown: Set<string> = new Set();

  logChannel: TextChannel | undefined;

  webhookListener: WebhookListener | undefined;
  dbl: dblapi | undefined;

  slash: SlashCreator | undefined;

  maintenance = {
    enabled: true,
    header: `Starting Up`,
    message: `The bot is still starting up! Please allow us a few moments...`,
  };

  // These are toggles that control what bot functions are enabled or disabled.
  public flags = {
    processMessages: true /* this.on("message", ()=>{}) listener */,
    commands: true /* General commands */,
    drops: true /* Card drops (user+activity) */,
    reminders: true /* DM reminders */,
    dmCommands: true /* Use of commands in DM channels */,
    useConfiscatedToken: false /* Use of the confiscated card token */,
    postServerCount: true /* Post server count to Top.gg */,
    mainViewing: true /* Viewing cards in #zephyr-main */,
    debugMessages: true /* Debug messages in console */,
    claimAlerts: true /* "You must wait X to claim" */,
  };

  /* These are some numbers that affect various things around Zephyr. */
  public modifiers = {
    globalRateLimit: 5000,

    boosterModifier: 5 /* Drops: card weight modifier for boosters */,
    birthdayModifier: 1.5 /* Drops: card weight modifier for idols whose birthday is "today" */,
    wishlistChance: 7.5 /* Drops: percent chance to receive a wishlist bonus */,

    /* Cooldown - 0 to disable */
    perUserRateLimit: 0 /* Message processing: rate limit, in ms, per user */,
    perChannelRateLimit: 0 /* Message processing: rate limit, in ms, per channel */,
    perGuildRateLimit: 0 /* Message processing: rate limit, in ms, per guild */,

    dailyQuestLimit: 5 /* Quests: number of maximum active daily quests per user */,
    weeklyQuestLimit: 2 /* Quests: number of maximum active weekly quests per user */,

    clubCreationPrice: 5000 /* Price in bits to create a club */,
    userClubMembershipLimit: 3 /* Maximum amount of clubs a user can be in */,
  };

  /* Rate limit sets */
  public userRateLimit: { [key: string]: number } = {};
  public channelRateLimit: { [key: string]: number } = {};
  public guildRateLimit: { [key: string]: number } = {};

  public confiscatedTagId = 1345;

  private generalChannelNames = [
    "welcome",
    "general",
    "lounge",
    "chat",
    "talk",
    "main",
  ];

  constructor() {
    super(config.discord.token, { restMode: true, maxShards: `auto` });
    this.config = config;
    this.users.limit = 50000;
    // this.setMaxListeners(500);
  }

  public async startTopGg(): Promise<void> {
    this.webhookListener = new WebhookListener();
    this.dbl = new dblapi(this.config.topgg.token, this);

    await this.webhookListener.init();

    if (this.config.topgg.postEnabled && this.flags.postServerCount) {
      await this.dbl.postStats(this.guilds.size);
      setInterval(async () => {
        if (this.dbl && this.flags.postServerCount) {
          await this.dbl.postStats(this.guilds.size);
        }
      }, 1800000);
    }
  }

  public async start() {
    const startTime = Date.now();

    await this.cachePrefixes();
    await this.cacheCards();

    /* Preload images into memory */
    await Frames.init();
    await Stickers.init();
    await Backgrounds.init();

    await Shop.init();

    const fonts = await FontLoader.init();

    await this.generatePrefabs();

    Quests.loadQuests();

    this.on("debug", (msg: string, _id: number) => {
      if (this.flags.debugMessages) {
        if (
          (msg.includes(" 429 ") || msg.includes("429:")) &&
          msg.includes(`"global": true`)
        ) {
          StatsD.increment(`zephyr.response.429`, 1);

          this.errors++;

          Logger.warn(`Global 429 detected, ${this.errors} total!`);
        }
      }
    });

    this.once("ready", async () => {
      if (this.config.topgg.enabled) await this.startTopGg();
      await this.commandLib.setup();

      const header = `===== ${chalk.hex(`#1fb7cf`)`PROJECT: ZEPHYR`} =====`;
      console.log(
        header +
          `\n\n- Took ${chalk.hex("1794E6")`${
            Date.now() - startTime
          }`}ms to start.` +
          `\n- Cached ${chalk.hex(
            "1794E6"
          )`${this.guilds.size.toLocaleString()}`} guild(s) / ${chalk.hex(
            "1794E6"
          )`${this.users.size.toLocaleString()}`} user(s)` +
          `\n- ${chalk.hex(
            `1794E6`
          )`${this.commandLib.commands.size}`} commands registered` +
          `\n- ${chalk.hex(`1794E6`)`${
            Object.keys(this.cards).length
          }`} cards registered` +
          `\n- ${chalk.hex(`1794E6`)`${fonts}`} fonts registered` +
          `\n\n${`=`.repeat(stripAnsi(header).length)}`
      );

      setInterval(() => {
        try {
          this.editStatus(`online`, {
            name: `with cards | ${this.guilds.size} servers`,
            type: 0,
          });
        } catch (e) {
          Logger.error(
            `Failed to update status with error ${e}.\nStack trace: ${e?.stack}`
          );
        }
      }, 300000);

      await DMHandler.handle();

      if (this.config.discord.logChannel) {
        const channel = await this.getRESTChannel(
          this.config.discord.logChannel
        );

        if (channel instanceof TextChannel) {
          this.logChannel = channel;
        }
      }
    });

    this.on("messageCreate", async (message) => {
      StatsD.timing(
        `discord.message.receivetime`,
        Date.now() - message.createdAt,
        1
      );
      StatsD.increment(`discord.message.received`, 1, 1);

      if (!this.flags.processMessages && !isDeveloper(message.author)) return;

      if (this.onCooldown.has(message.author.id)) return;

      if (message.author.bot || !message.channel) return;

      await this.fetchUser(message.author.id);

      if (
        message.channel instanceof PrivateChannel &&
        this.flags.dmCommands &&
        this.flags.commands
      ) {
        await this.commandLib.process(message as Message<PrivateChannel>);
      }

      if (!(message.channel instanceof TextChannel)) return;

      // check if we're allowed to send messages to this channel
      if (!message.channel.permissionsOf(this.user.id).json["sendMessages"])
        return;

      // Prefix resetter
      if (
        message.mentions[0]?.id === this.user.id &&
        message.content.includes(this.user.id)
      ) {
        const subcommand = message.content.split(" ")[1]?.toLowerCase();

        if (subcommand === "reset") {
          if (
            !(<TextChannel>message.channel).permissionsOf(message.author.id)
              .json["manageChannels"]
          )
            return;

          this.setPrefix(message.guildID!, this.config.discord.defaultPrefix);
          await GuildService.setPrefix(
            message.guildID!,
            this.config.discord.defaultPrefix
          );

          try {
            await createMessage(
              message.channel,
              `Reset your prefix to \`${this.config.discord.defaultPrefix}\``
            );
          } catch {}

          return;
        }

        try {
          await createMessage(
            message.channel,
            `My prefix here is \`${this.getPrefix(message.guildID!)}\`!`
          );
        } catch {}

        return;
      }

      // go ahead if we're allowed to speak
      if (this.flags.commands)
        await this.commandLib.process(message as Message<TextChannel>);

      // message counter
      await CardSpawner.processMessage(
        this.guilds.find((g) => g.id === message.guildID!)!,
        message.author
      );
    });

    this.on("guildDelete", async (guild) => {
      let trueGuild;

      let findGuild = this.guilds.find((g) => guild.id === g.id);

      if (!findGuild) {
        trueGuild = await this.getRESTGuild(guild.id);
      } else trueGuild = findGuild;

      if (this.logChannel) {
        try {
          await createMessage(
            this.logChannel,
            `:outbox_tray: Zephyr left a server: **${trueGuild.name}** (${trueGuild.id}).\nMember count: **${trueGuild.memberCount}**`
          );
        } catch (e) {
          Logger.error(
            `Failed to send guild delete log (${guild.id}) - ${e.stack}`
          );
        }
      }
    });

    // Introduction when it joins a new guild
    this.on("guildCreate", async (guild) => {
      if (this.logChannel) {
        try {
          await createMessage(
            this.logChannel,
            `:inbox_tray: Zephyr joined a new server: **${guild.name}** (${guild.id}).\nMember count: **${guild.memberCount}**`
          );
        } catch (e) {
          Logger.error(
            `Failed to send guild create log (${guild.id}) - ${e.stack}`
          );
        }
      }

      // Get ONLY TextChannels in the guild (type === 0)
      const channels = guild.channels.filter(
        (c) => c.type === 0
      ) as TextChannel[];

      // The channel we're eventually going to send the message to
      let welcomeChannel;

      // Find any channels with names including anything from this.generalChannelNames
      for (let channel of channels) {
        for (let generalName of this.generalChannelNames) {
          if (channel.name.toLowerCase().includes(generalName))
            welcomeChannel = channel;
        }
      }

      // If we couldn't find a channel, defer to the highest hoisted channel we can send messages to
      if (!welcomeChannel) {
        const channels = Array.from(guild.channels.values()).filter(
          (c) => c.type === 0
        ) as TextChannel[];
        // Sorts the channels in order of "increasing" position (lower position value = higher on the guild list)
        const top = channels.sort((a, b) => {
          return a.position > b.position ? 1 : -1;
        });

        // Check if we can send messages...
        for (let channel of top) {
          if (
            checkPermission(`sendMessages`, channel) &&
            checkPermission(`readMessages`, channel)
          ) {
            welcomeChannel = channel as TextChannel;
            break;
          }
        }
      }

      // Didn't find anything? Oh well...
      if (!welcomeChannel) return;

      // No permission? Oh well...
      if (
        !checkPermission(`sendMessages`, welcomeChannel) ||
        !checkPermission(`readMessages`, welcomeChannel)
      )
        return;

      // Get the prefix just in case it's already diferent (bot previously in guild)
      const prefix = this.getPrefix(guild.id);
      const embed = new MessageEmbed(`Welcome | ${guild.name}`).setDescription(
        `**Thanks for inviting Zephyr!**` +
          `\nUse \`${prefix}setchannel\` in any channel to set that channel as the Zephyr channel.` +
          `\n\n**Common configuration**` +
          `\n— \`${prefix}prefix <prefix>\` - changes the bot's prefix`
      );

      try {
        await createMessage(welcomeChannel, embed);
      } catch {}

      return;
    });

    this.on("error", (error) => {
      Logger.error(`${error.message} - ${error.stack}`);
    });

    /*
        Shards
    */
    this.on("shardReady", (id) => {
      Logger.debug(`Shard ${id} is ready!`);
    });

    this.on("shardDisconnect", (err, id) => {
      Logger.error(
        `Shard ${id} disconnected${
          err ? `  with error: ${err}\n${err?.stack}` : `. No error was given.`
        }`
      );
    });

    this.slash = new SlashCreator({
      applicationID: this.config.discord.applicationId,
      publicKey: this.config.discord.publicKey,
      token: this.config.discord.token,
    });

    this.slash
      .withServer(
        new GatewayServer(async (handler: any) =>
          this.on(`rawWS`, async (event) => {
            if (event.t === `INTERACTION_CREATE`) await handler(event.d);
          })
        )
      )
      .registerCommandsIn(path.join(__dirname, `commands`))
      .syncCommands();

    this.slash.on(`componentInteraction`, async (ctx) => {
      await ctx.defer(true);

      if (ctx.customID === `drop1`) {
        await CardSpawner.handleClaim(ctx.message.id, 1, ctx);
      } else if (ctx.customID === `drop2`) {
        await CardSpawner.handleClaim(ctx.message.id, 2, ctx);
      } else if (ctx.customID === `drop3`) {
        await CardSpawner.handleClaim(ctx.message.id, 3, ctx);
      }
    });

    this.slash.on(`error`, (err) => {
      Logger.error(`slash-create error: ${err}`);
    });

    this.connect();
  }

  /*
      Prefix Caching
  */
  public async cachePrefixes(): Promise<void> {
    const prefixes = await GuildService.getPrefixes();
    this.prefixes = prefixes;
    return;
  }

  public getPrefix(guildId?: string): string {
    if (!guildId) return config.discord.defaultPrefix;
    return this.prefixes[guildId] ?? config.discord.defaultPrefix;
  }

  public setPrefix(guildId: string, prefix: string): void {
    this.prefixes[guildId] = prefix;
    return;
  }

  /*
      Card Caching
  */
  public async cacheCards(): Promise<void> {
    const cards = (await CardService.getAllCards()).filter((c) => c.activated);

    const newCardObject: { [key: number]: GameBaseCard } = {};
    const newIdolObject: { [id: number]: GameIdol } = {};

    for (let card of cards) {
      newCardObject[card.id] = card;

      newIdolObject[card.idolId] = {
        id: card.idolId,
        name: card.name,
        birthday: card.birthday,
      };
    }

    this.cards = newCardObject;
    this.idols = newIdolObject;

    return;
  }

  public async generatePrefabs(): Promise<void> {
    const cards = this.getCards();
    for (let card of cards) {
      await CardService.generatePrefabCache(card);
    }

    if (loggerSettings.debug) {
      Logger.debug(`${cards.length} prefabs were read or generated.`);
    }

    return;
  }

  public getCard(id: number): GameBaseCard | undefined {
    return this.cards[id];
  }

  public incrementBaseCardSerialNumber(card: GameBaseCard): GameBaseCard {
    this.cards[card.id].serialTotal += 1;

    return this.cards[card.id];
  }

  public getIdol(id: number): GameIdol | undefined {
    return this.idols[id];
  }

  public getIdolsByName(name: string): GameIdol[] {
    return Object.values(this.idols).filter(
      (idol) => idol.name.toLowerCase() === name.toLowerCase()
    );
  }

  public getGroupById(id: number): string | undefined {
    return Object.values(this.cards).find((c) => c.groupId === id)?.group;
  }

  public getGroupIdByName(name: string): number | undefined {
    return Object.values(this.cards).find(
      (c) => c.group?.toLowerCase() === name.toLowerCase()
    )?.groupId;
  }

  public async refreshCard(id: number): Promise<GameBaseCard> {
    const recached = await CardService.getCardById(id);

    this.cards[recached.id] = recached;

    return recached;
  }

  public getRandomCards(
    amount: number,
    wishlist: GameWishlist[] = [],
    booster?: number,
    restricted: boolean = false
  ): GameBaseCard[] {
    // Get today's date so we can weigh birthday idols appropriately
    const today = dayjs().format(`MM-DD`);

    // Get median serial number for use in averaging out drops
    const droppableCards = this.getCards().filter((c) => {
      if (c.rarity === 0) return false;

      if (!c.activated) return false;

      if (c.serialLimit > 0 && c.serialTotal >= c.serialLimit) return false;

      if (restricted && c.serialTotal < 1500) return false;

      return true;
    });

    const median = droppableCards.map((c) => c.serialTotal)[
      Math.ceil(droppableCards.length / 2)
    ];

    // Get all activated cards with a rarity > 0 not at serial limit, and map them with their weights
    const weightedCards = droppableCards.map((c) => {
      // Each card receives a base weighting of 100
      let weight = 100;

      // Calculate relative weighting based on serial number
      const relativeMultiplier = Math.max(
        0.00001,
        Math.min(1, (median / Math.max(1, c.serialTotal)) * 1.025)
      );

      weight *= relativeMultiplier;

      // The base weighting is multiplied by the boost modifier if the boosted group matches the card's group
      if (c.groupId && c.groupId === booster)
        weight *= this.modifiers.boosterModifier;

      // The base weighting is multiplied by the birthday modifier if the idol's birthday is today
      if (c.birthday) {
        const birthday = c.birthday.split(`-`).slice(1).join(`-`);

        if (today === birthday) weight *= this.modifiers.birthdayModifier;
      }

      return { card: c, weight: weight };
    });

    // Random cards chosen, up to `amount`
    const pickedCards: GameBaseCard[] = [];

    if (wishlist.length > 0) {
      const receiveWishlistBonus = this.chance.bool({
        likelihood: this.modifiers.wishlistChance,
      });

      if (receiveWishlistBonus) {
        // Finds only wishlisted idols who have droppable cards
        const validWishlists = wishlist.filter((w) =>
          weightedCards.find((c) => c.card.idolId === w.idolId)
        );
        const wishlistCards: { card: GameBaseCard; weight: number }[] = [];

        // Add card candidates to their own array
        for (let wish of validWishlists) {
          const cards = weightedCards.filter(
            (c) => c.card.idolId === wish.idolId
          );

          wishlistCards.push(...cards);
        }

        if (wishlistCards.length > 0) {
          // Choose a random wishlist card
          const pickedWishlistCard = this.chance.weighted(
            wishlistCards.map((c) => c.card),
            wishlistCards.map((c) => c.weight)
          );

          // Add it to the final cards array
          pickedCards.push(pickedWishlistCard);
        }
      }
    }

    while (pickedCards.length < amount) {
      // Removes duplicate groups and idols from the pool
      const newDroppableCards = weightedCards.filter((c) => {
        if (pickedCards.find((p) => p.idolId === c.card.idolId)) return false;
        if (pickedCards.find((p) => p.groupId === c.card.groupId)) return false;

        return true;
      });

      const randomCard = this.chance.weighted(
        newDroppableCards.map((c) => c.card),
        newDroppableCards.map((c) => c.weight)
      );
      pickedCards.push(randomCard);
    }

    return pickedCards;
  }

  public getCards(): GameBaseCard[] {
    return Object.values(this.cards);
  }

  public getCardsByGroup(id: number): GameBaseCard[] {
    return this.getCards().filter((c) => c.groupId === id);
  }

  /*
      Functions-That-Probably-Should-Be-In-Eris-Anyway-But-Whatever
  */
  public async fetchUser(
    userId: string,
    ignoreCache: boolean = false
  ): Promise<User | undefined> {
    if (ignoreCache) {
      try {
        StatsD.increment(`zephyr.rest.channel.get`, 1);
        const user = await this.getRESTUser(userId);
        this.users.add(user);
        return user;
      } catch (e) {
        return;
      }
    }
    // check if user is already in cache
    const findUser = this.users.get(userId);
    if (!findUser) {
      try {
        StatsD.increment(`zephyr.rest.channel.get`, 1);
        const user = await this.getRESTUser(userId);
        this.users.add(user);
        return user;
      } catch (e) {
        return;
      }
    } else {
      StatsD.increment(`zephyr.rest.channel.cache_hit`, 1);
      this.users.update(findUser);
      return findUser;
    }
  }

  public async fetchGuild(
    guildId: string,
    ignoreCache: boolean = false
  ): Promise<Guild | undefined> {
    if (ignoreCache) {
      try {
        StatsD.increment(`zephyr.rest.guild.get`, 1);
        const guild = await this.getRESTGuild(guildId);
        this.guilds.add(guild);
        return guild;
      } catch (e) {
        return;
      }
    }

    // check if guild is already in cache
    const findGuild = this.guilds.find((g) => g.id === guildId);
    if (!findGuild) {
      try {
        StatsD.increment(`zephyr.rest.guild.get`, 1);
        const guild = await this.getRESTGuild(guildId);
        this.guilds.add(guild);
        return guild;
      } catch (e) {
        return;
      }
    } else {
      StatsD.increment(`zephyr.rest.guild.cache_hit`, 1);
      this.guilds.update(findGuild);
      return findGuild;
    }
  }

  /*
      Vote Handler
  */
  public async handleVote(voterId: string, isWeekend: boolean): Promise<void> {
    const profile = await ProfileService.getProfile(voterId, true);
    const voter = await this.fetchUser(voterId);

    await ProfileService.addVote(profile, isWeekend);
    await AnticheatService.logVote(profile, isWeekend);

    const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
      profile,
      QuestObjective.VOTE
    );

    if (progressableQuests.length > 0) {
      const progressions = progressableQuests.map((q) => {
        return { ...q, increment: 1 } as QuestProgression;
      });

      await QuestSetter.progressQuests(progressions, profile);
    }

    if (!voter || profile.blacklisted) return;

    try {
      const dmChannel = await voter.getDMChannel();

      const embed = new MessageEmbed(`Vote`, voter).setDescription(
        `:sparkles: Thanks for voting, **${
          voter.username
        }**! You've been given **${isWeekend ? 4 : 2}** cubits!`
      );
      await createMessage(dmChannel, embed);
    } catch {}
  }
}

export const Zephyr = new ZephyrClient();
