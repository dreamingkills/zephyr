import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { Client } from "eris";
import config from "../../../config.json";
import { CommandLib } from "../../lib/command/CommandLib";

export class Zephyr extends Client {
  commandLib = new CommandLib();
  public async start() {
    const startTime = Date.now();
    this.on("ready", async () => {
      await this.commandLib.setup(this);

      const header = `===== ${chalk.hex(
        `#1fb7cf`
      )`PROJECT: ZEPHYR`} (${chalk.hex(`#1fb7cf`)`${config.version}`}) =====`;
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
          `\n\n${`=`.repeat(stripAnsi(header).length)}`
      );
    });
    this.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      await this.commandLib.process(message, this);
    });

    this.connect();
  }
  constructor() {
    super(config.discord.token);
  }
}
