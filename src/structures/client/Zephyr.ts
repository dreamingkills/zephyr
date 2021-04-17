import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { Client, Guild, PrivateChannel, TextChannel, User } from "eris";
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
import { BuiltSticker, GameSticker } from "../game/Sticker";
import { createMessage } from "../../lib/discord/message/createMessage";
import dayjs from "dayjs";
import { GameIdol } from "../game/Idol";
import { Image, loadImage } from "canvas";
import fs from "fs/promises";
import { StatsD } from "../../lib/StatsD";
import { AlbumService } from "../../lib/database/services/game/AlbumService";
import { GameFrame, IntermediateFrame } from "../game/Frame";
import * as ZephyrError from "../error/ZephyrError";
import { Stickers } from "../../lib/cosmetics/Stickers";

export class Zephyr extends Client {
  commandLib = new CommandLib();
  dmHandler = new DMHandler();
  readonly config: typeof config;
  chance = new Chance();
  private prefixes: { [guildId: string]: string } = {};
  private cards: { [cardId: number]: GameBaseCard } = {};

  private idols: { [id: number]: GameIdol } = {};

  private errors: number = 0;

  onCooldown: Set<string> = new Set();

  /* Images */
  private frames: GameFrame[] = [];
  private stickers: GameSticker[] = [];

  private backgrounds: {
    [backgroundId: number]: {
      id: number;
      name: string;
      image: Image;
    };
  } = {};

  logChannel: TextChannel | undefined;

  webhookListener: WebhookListener | undefined;
  dbl: dblapi | undefined;

  // These are toggles that control what bot functions are enabled or disabled.
  public flags = {
    processMessages: true /* this.on("message", ()=>{}) listener - DANGEROUS */,
    commands: true /* General commands */,
    drops: false /* Card drops (user+activity) */,
    trades: false /* Multitrade, normal trade, gift */,
    reminders: false /* DM reminders */,
    transactions: false /* Paying bits, withdrawing from bank, shop */,
    dyes: false /* Dyeing cards */,
    upgrades: false /* Upgrading cards */,
    burns: false /* Burning cards */,
    crafting: false /* Crafting recipes and recipe viewer */,
    dmCommands: false /* Use of commands in DM channels */,
    useConfiscatedToken: false /* Use of the confiscated card token */,
    postServerCount: true /* Post server count to Top.gg */,
    mainViewing: true /* Viewing cards in #zephyr-main */,
    debugMessages: true /* Debug messages in console */,
    claimAlerts: false /* "You must wait X to claim" */,
  };

  /* These are some numbers that affect various things around Zephyr. */
  public modifiers = {
    boosterModifier: 5 /* Drops: card weight modifier for boosters */,
    birthdayModifier: 1.5 /* Drops: card weight modifier for idols whose birthday is "today" */,
    wishlistChance: 7.5 /* Drops: percent chance to receive a wishlist bonus */,

    /* Cooldown - 0 to disable */
    perUserRateLimit: 0 /* Message processing: rate limit, in ms, per user */,
    perChannelRateLimit: 0 /* Message processing: rate limit, in ms, per channel */,
    perGuildRateLimit: 0 /* Message processing: rate limit, in ms, per guild */,
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
    this.setMaxListeners(500);
  }

  public async startTopGg(): Promise<void> {
    this.webhookListener = new WebhookListener();
    this.dbl = new dblapi(this.config.topgg.token, this);

    await this.webhookListener.init(this);

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
    await this.cachePrefixes();
    await this.cacheCards();

    /* Preload images into memory */
    await this.loadFrames();
    await Stickers.loadStickers();
    await this.loadBackgrounds();

    /* Shop stuff */
    await Stickers.loadStickerPacks();

    const fonts = await FontLoader.init();

    await this.generatePrefabs();

    const startTime = Date.now();

    this.on("debug", (msg: string, _id: number) => {
      if (this.flags.debugMessages) {
        if (msg.includes(" 429 ") || msg.includes("429:")) {
          StatsD.increment(`zephyr.response.429`, 1);
          console.log(`429 Detected: ${msg}`);
          this.errors++;

          console.log(`${this.errors} total 429s`);
        }
      }
    });

    this.once("ready", async () => {
      if (this.config.topgg.enabled) await this.startTopGg();
      await this.commandLib.setup(this);

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
          )`${this.commandLib.commands.length}`} commands registered` +
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
          console.log(
            `Failed to update status with error ${e}.\nStack trace: ${e?.stack}`
          );
        }
      }, 300000);
      await this.dmHandler.handle(this);

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
      if (!this.flags.processMessages && !isDeveloper(message.author, this))
        return;

      if (this.onCooldown.has(message.author.id)) return;

      if (message.author.bot || !message.channel) return;
      StatsD.increment(`zephyr.message.receive`, 1);

      await this.fetchUser(message.author.id);

      if (message.channel instanceof PrivateChannel && this.flags.dmCommands) {
        await this.commandLib.process(message, this);
        return;
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
      if (this.flags.commands) await this.commandLib.process(message, this);

      // message counter
      await CardSpawner.processMessage(
        this.guilds.find((g) => g.id === message.guildID!)!,
        message.author,
        this
      );
    });

    this.on("guildDelete", async (guild) => {
      if (this.logChannel) {
        try {
          await createMessage(
            this.logChannel,
            `:outbox_tray: Zephyr left a server: **${guild.name}** (${guild.id}).\nMember count: **${guild.memberCount}**`
          );
        } catch (e) {
          console.log(
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
          console.log(
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
            checkPermission(`sendMessages`, channel, this) &&
            checkPermission(`readMessages`, channel, this)
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
        !checkPermission(`sendMessages`, welcomeChannel, this) ||
        !checkPermission(`readMessages`, welcomeChannel, this)
      )
        return;

      // Get the prefix just in case it's already different (bot previously in guild)
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
      console.log(`${error.message} - ${error.stack}`);
    });

    /*
        Shards
    */
    this.on("shardReady", (id) => {
      console.log(`Shard ${id} is ready!`);
    });

    this.on("shardDisconnect", (err, id) => {
      console.log(
        `Shard ${id} disconnected${
          err ? `  with error: ${err}\n${err?.stack}` : `. No error was given.`
        }`
      );
    });

    this.connect();
  }

  /*
      Image Precaching (frames, stickers, backgrounds)
  */
  private async loadFrames(): Promise<void> {
    const frames = await CardService.getAllFrames();

    for (let frame of frames) {
      const intermediate: IntermediateFrame = {
        id: frame.id,
        name: frame.frame_name || `Unknown Frame`,
        frame: await loadImage(
          frame.frame_url || `./src/assets/frames/default/frame-default.png`
        ),
        mask: await fs.readFile(
          frame.dye_mask_url || `./src/assets/frames/default/mask-default.png`
        ),
        overlay: frame.overlay,
        textColor: frame.text_color_hex || `000000`,
      };

      const completeFrame = new GameFrame(intermediate);

      this.frames.push(completeFrame);
    }

    return;
  }

  private async loadBackgrounds(): Promise<void> {
    const backgrounds = await AlbumService.getAllBackgrounds();

    for (let bg of backgrounds) {
      this.backgrounds[bg.id] = {
        id: bg.id,
        name: bg.name,
        image: await loadImage(
          bg.imageUrl || `./src/assets/backgrounds/default.jpg`
        ),
      };
    }
  }

  public getFrameById(id: number): GameFrame {
    const frame = this.frames.find((f) => f.id === id);

    if (!frame) throw new ZephyrError.FrameNotFoundError();

    return frame;
  }

  public getFrameByName(name: string): GameFrame {
    const frame = this.frames.find(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    );

    if (!frame) throw new ZephyrError.FrameNotFoundError();

    return frame;
  }

  public getBackgroundById(
    id: number
  ): { id: number; name: string; image: Image } | undefined {
    return this.backgrounds[id];
  }

  public getBackgroundByName(
    name: string
  ): { id: number; name: string; image: Image } | undefined {
    const background = Object.values(this.backgrounds).find(
      (b) => b.name.toLowerCase() === name.toLowerCase()
    );

    return background;
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
    console.log(`Generated ${cards.length} prefabs.`);
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
      const relativeMultiplier = Math.min(
        1,
        (median / Math.max(1, c.serialTotal)) * 1.025
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
      Sticker Caching
  */
  public getStickerById(id: number): BuiltSticker | undefined {
    return this.stickers.find((s) => s.id === id);
  }

  public getStickerByItemId(itemId: number): BuiltSticker | undefined {
    return this.stickers.filter((s) => s.itemId === itemId)[0];
  }

  public getStickerByName(name: string): BuiltSticker | undefined {
    return this.stickers.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
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
