import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { Client, TextChannel, User } from "eris";
import config from "../../../config.json";
import { CommandLib } from "../../lib/command/CommandLib";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { GameBaseCard } from "../game/BaseCard";
import { CardService } from "../../lib/database/services/game/CardService";
import { FontLoader } from "../../lib/FontLoader";

export class Zephyr extends Client {
  version: string = "beta-0.2";
  commandLib = new CommandLib();
  prefixes: { [guildId: string]: string } = {};
  cards: { [cardId: number]: GameBaseCard } = {};
  config: typeof config;
  constructor() {
    super(config.discord.token, { restMode: true });
    this.config = config;
    this.users.limit = 10000;
  }

  public async start() {
    await this.cachePrefixes();
    await this.cacheCards();
    const fonts = await FontLoader.init();
    this.connect();

    const startTime = Date.now();
    this.on("ready", async () => {
      await this.commandLib.setup(this);

      const header = `===== ${chalk.hex(
        `#1fb7cf`
      )`PROJECT: ZEPHYR`} (${chalk.hex(`#1fb7cf`)`${this.version}`}) =====`;
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
    });
    this.on("messageCreate", async (message) => {
      await this.fetchUser(message.author.id);
      // type 0 corresponds to TextChannel
      if (message.author.bot || message.channel.type !== 0) return;

      // check if we're allowed to send messages to this channel
      if (!message.channel.permissionsOf(this.user.id).json["sendMessages"])
        return;

      // go ahead if we're allowed to speak
      await this.commandLib.process(message, this);
    });
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
    const cards = await CardService.getAllCards();
    for (let card of cards) {
      this.cards[card.id] = card;
    }
    return;
  }
  public getCard(id: number): GameBaseCard {
    return this.cards[id];
  }

  /*
      Functions-That-Probably-Should-Be-In-Eris-Anyway-But-Whatever
  */
  public async fetchUser(
    userId: string,
    ignoreCache: boolean = false
  ): Promise<User> {
    if (ignoreCache) {
      const user = await this.getRESTUser(userId);
      this.users.add(user);
      return user;
    }
    // check if user is already in cache
    const findUser = this.users.get(userId);
    if (!findUser) {
      const user = await this.getRESTUser(userId);
      this.users.add(user);
      return user;
    } else {
      this.users.update(findUser);
      return findUser;
    }
  }

  /*
      Permissions
  */
  public checkPermission(permission: string, channel: TextChannel) {
    return channel.permissionsOf(this.user.id).json[permission];
  }
}
