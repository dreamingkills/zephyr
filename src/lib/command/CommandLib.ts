import { BaseCommand } from "../../structures/command/Command";
import glob from "glob";
import { promisify } from "util";
import { Message } from "eris";
import { ProfileService } from "../database/services/game/ProfileService";
import { Zephyr } from "../../structures/client/Zephyr";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export class CommandLib {
  commands: BaseCommand[] = [];
  async setup(zephyr: Zephyr): Promise<void> {
    const _glob = promisify(glob);
    const files = await _glob(
      `${require("path").dirname(require.main?.filename)}/commands/**/*.js`
    );
    for (let f of files) {
      try {
        const cmdExport = require(f);
        if (!cmdExport.default) return;
        const cmd = new cmdExport.default(zephyr) as BaseCommand;
        this.commands.push(cmd);
      } catch {
        continue;
      }
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
    if (
      command.developerOnly &&
      zephyr.config.developers.indexOf(message.author.id) < 0
    ) {
      const embed = new MessageEmbed()
        .setAuthor(
          `Error | ${message.author.tag}`,
          message.author.dynamicAvatarURL("png")
        )
        .setDescription(`This command is only usable by the developer.`);
      await message.channel.createMessage({ embed });
      return;
    }

    try {
      const profile = await ProfileService.getProfile(message.author.id, true);
      await command.run(message, profile, zephyr);
    } catch (e) {
      if (e.isClientFacing) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Error | ${message.author.tag}`,
            message.author.dynamicAvatarURL("png")
          )
          .setDescription(e.message);
        await message.channel.createMessage({ embed });
      } else {
        const embed = new MessageEmbed()
          .setAuthor(
            `Error | ${message.author.tag}`,
            message.author.dynamicAvatarURL("png")
          )
          .setDescription(`An unexpected error occurred. Please try again.`);
        await message.channel.createMessage({ embed });
        console.error(e);
      }
    }
  }
}
