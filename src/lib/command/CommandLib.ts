import { BaseCommand } from "../../structures/command/Command";
import glob from "glob";
import { promisify } from "util";
import { Message } from "eris";
import { ProfileService } from "../database/services/game/ProfileService";
import { Zephyr } from "../../structures/client/Zephyr";

export class CommandLib {
  commands: BaseCommand[] = [];
  async setup(zephyr: Zephyr): Promise<void> {
    const _glob = promisify(glob);
    const files = await _glob(
      `${require("path").dirname(require.main?.filename)}/commands/**/*.js`
    );
    for (let f of files) {
      const cmdExport = require(f);
      if (!cmdExport.default) return;
      const cmd = new cmdExport.default(zephyr) as BaseCommand;
      this.commands.push(cmd);
    }
  }

  async process(message: Message, zephyr: Zephyr): Promise<void> {
    const guild = zephyr.guilds.get(message.guildID!);
    const prefix = zephyr.getPrefix(guild!.id);
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
    try {
      const profile = await ProfileService.getProfile(message.author.id, true);
      await command.run(message, profile, zephyr);
    } catch (e) {
      await message.channel.createMessage(e.message);
      if (!e.isClientFacing) console.error(e);
    }
  }
}
