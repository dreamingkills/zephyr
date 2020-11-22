import { BaseCommand } from "../../structures/command/Command";
import glob from "glob";
import { promisify } from "util";
import { Message } from "discord.js";

export class CommandLib {
  commands: BaseCommand[] = [];
  async setup(): Promise<void> {
    const _glob = promisify(glob);
    const files = await _glob(
      `${require("path").dirname(require.main?.filename)}/commands/**/*.js`
    );
    for (let f of files) {
      const cmdExport = require(f);
      if (!cmdExport.default) return;
      const cmd = new cmdExport.default() as BaseCommand;
      this.commands.push(cmd);
    }
  }

  async process(message: Message): Promise<void> {
    const prefix = `!`;
    const commandNameRegExp = new RegExp(
      `^(${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(\\S+)`,
      `g`
    ).exec(message.content.toLowerCase());
    if (!commandNameRegExp) return;
    const commandName = commandNameRegExp[0].slice(prefix.length);

    const commandMatch = this.commands.filter(
      (c) => c.names.indexOf(commandName) > -1
    );
    if (!commandMatch[0]) return;
    if (commandMatch.length > 1)
      console.warn(`Duplicate command found: ${commandName}`);

    const command = commandMatch[0];
    await command.exec(message);
  }
}
