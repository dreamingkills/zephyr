import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { Client } from "discord.js";
import config from "../../../config.json";

export class Zephyr extends Client {
  public async start() {
    const startTime = Date.now();
    this.on("ready", () => {
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
          )`${this.guilds.cache.size.toLocaleString()}`} guild(s) / ${chalk.hex(
            "1794E6"
          )`${this.users.cache.size.toLocaleString()}`} user(s)` +
          `\n\n${`=`.repeat(stripAnsi(header).length)}`
      );
    });
    this.login(config.discord.token);
  }
}
