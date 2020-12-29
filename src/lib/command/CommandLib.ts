import { BaseCommand } from "../../structures/command/Command";
import glob from "glob";
import { promisify } from "util";
import { Message } from "eris";
import { ProfileService } from "../database/services/game/ProfileService";
import { Zephyr } from "../../structures/client/Zephyr";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import * as ZephyrError from "../../structures/error/ZephyrError";

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
    let prefix;
    if (message.channel.type === 1) {
      prefix = ".";
    } else {
      const guild = await zephyr.fetchGuild(message.guildID!);
      if (!guild) return;

      prefix = zephyr.getPrefix(guild!.id);
    }

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
      try {
        await message.channel.createMessage({ embed });
      } catch {
      } finally {
        return;
      }
    }

    try {
      const profile = await ProfileService.getProfile(message.author.id, true);

      if (profile.blacklisted) throw new ZephyrError.AccountBlacklistedError();
      if (message.channel.type === 1 && !command.allowDm)
        throw new ZephyrError.NotAllowedInDMError();

      await command.run(message, profile, zephyr);
    } catch (e) {
      if (e.isClientFacing) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Error | ${message.author.tag}`,
            message.author.dynamicAvatarURL("png")
          )
          .setDescription(e.message);
        try {
          await message.channel.createMessage({ embed });
        } catch {}
      } else {
        if (e.name === "Missing Access") return;
        console.log(`ERROR NAME: ${e}\n${e}`);
        const embed = new MessageEmbed()
          .setAuthor(
            `Error | ${message.author.tag}`,
            message.author.dynamicAvatarURL("png")
          )
          .setDescription(`An unexpected error occurred. Please try again.`);
        try {
          await message.channel.createMessage({ embed });
        } catch {}
      }
    }
  }
}
