import { BaseCommand } from "../../structures/command/Command";
import glob from "glob";
import { promisify } from "util";
import { Message } from "eris";
import { ProfileService } from "../database/services/game/ProfileService";
import { Zephyr } from "../../structures/client/Zephyr";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { createMessage } from "../discord/message/createMessage";
import { GameProfile } from "../../structures/game/Profile";
import dayjs from "dayjs";
import { BlacklistService } from "../database/services/meta/BlacklistService";
import { AnticheatService } from "../database/services/meta/AnticheatService";
import { Logger } from "../logger/Logger";

export class CommandLib {
  commands: BaseCommand[] = [];

  async setup(): Promise<void> {
    const _glob = promisify(glob);
    const files = await _glob(
      `${require("path").dirname(require.main?.filename)}/commands/**/*.js`
    );
    for (let f of files) {
      try {
        const cmdExport = require(f);
        if (!cmdExport.default) continue;

        const cmd = new cmdExport.default(Zephyr) as BaseCommand;
        this.commands.push(cmd);
      } catch {
        continue;
      }
    }
  }

  async process(message: Message): Promise<void> {
    const isDm = !message.guildID;

    let prefix = Zephyr.config.discord.defaultPrefix;

    if (!isDm) {
      prefix = Zephyr.getPrefix(message.guildID);
    }

    const commandNameRegExp = new RegExp(
      `^(${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(\\S+)`,
      `g`
    ).exec(message.content.toLowerCase());
    if (!commandNameRegExp) return;

    const commandName = commandNameRegExp[0].slice(prefix.length);

    const commandMatch = this.commands.filter((c) =>
      c.names.includes(commandName)
    );
    if (!commandMatch[0]) return;

    if (commandMatch.length > 1)
      console.warn(`Duplicate command found: ${commandName}`);

    const command = commandMatch[0];

    if (isDm && !command.allowDm) {
      const embed = new MessageEmbed(`Error`, message.author).setDescription(
        `You cannot use that command in DMs.`
      );

      await createMessage(message.channel, embed);
      return;
    }

    if (
      command.developerOnly &&
      !Zephyr.config.developers.includes(message.author.id)
    ) {
      const embed = new MessageEmbed(`Error`, message.author).setDescription(
        `This command is only usable by the developer.`
      );

      try {
        await createMessage(message.channel, embed);
      } catch {}

      return;
    } else if (
      command.moderatorOnly &&
      !Zephyr.config.moderators.includes(message.author.id) &&
      !Zephyr.config.developers.includes(message.author.id)
    ) {
      const embed = new MessageEmbed(`Error`, message.author).setDescription(
        `This command is only usable by Zephyr staff.`
      );

      try {
        await createMessage(message.channel, embed);
      } catch {}

      return;
    }

    try {
      let profile: GameProfile;
      try {
        profile = await ProfileService.getProfile(message.author.id);
      } catch {
        profile = await ProfileService.getProfile(message.author.id, true);

        try {
          const dmChannel = await message.author.getDMChannel();

          const embed = new MessageEmbed(
            `Welcome`,
            message.author
          ).setDescription(
            `Hey **${message.author.username}**! Welcome to Zephyr!` +
              `\n\nFirst and foremost, you should know the Zephyr Rules.` +
              `\nThese rules apply across all servers, no matter where you play!` +
              `\n\`\`\`md` +
              `\n1. Alternate accounts are not permitted for any reason. Likewise, funnelling cards directly or indirectly into one account is not permitted.` +
              `\n2. Automating bot functions (self-botting) is not permitted for any reason.` +
              `\n3. Cross-bot trade is not allowed.` +
              `\n4. Selling cards for real-world money or items is not allowed.` +
              `\n\`\`\`` +
              `\nDiscover communities, win giveaways, and get update alerts in **Zephyr Community**!` +
              `\n:point_right: Just [click here](https://discord.gg/zephyr) to join us!`
          );
          await createMessage(dmChannel, embed);
        } catch {
          // their loss I guess lol
        }

        const creationDate = dayjs(message.author.createdAt);
        const now = dayjs();

        if (now < creationDate.add(14, `day`) && Zephyr.logChannel) {
          await createMessage(
            Zephyr.logChannel,
            `:warning: New account (<2 weeks) joined: **${
              message.author.tag
            }** (${message.author.id})\nCreation date: ${creationDate.format(
              `YYYY-MM-DD HH:mm:ss`
            )}\nGuild created in: **${message.guildID || `DMs`}**`
          );
        }
      }

      if (profile.blacklisted) {
        const blacklist = await BlacklistService.findBlacklist(profile);

        if (!blacklist) throw new ZephyrError.AccountBlacklistedNoCaseError();

        throw new ZephyrError.AccountBlacklistedError(blacklist);
      }

      if (!Zephyr.config.moderators.includes(message.author.id)) {
        if (Zephyr.onCooldown.has(message.author.id)) return;

        Zephyr.onCooldown.add(message.author.id);
        setTimeout(
          () => Zephyr.onCooldown.delete(message.author.id),
          Zephyr.modifiers.globalRateLimit
        );
      }

      await command.run(message, profile);

      if (command.id) {
        await AnticheatService.logCommand(
          command.id,
          message,
          message.content,
          false
        );
      }
    } catch (e) {
      if (e.isClientFacing) {
        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          e.message
        );
        try {
          await createMessage(message.channel, embed);
        } catch {}
      } else {
        if (e.name === "Missing Access") return;
        Logger.error(
          `Error executing command "${command.names[0]}" (ID ${command.id}):\n${e} - ${e?.stack}`
        );

        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          `An unexpected error occurred. Please try again.`
        );
        try {
          await createMessage(message.channel, embed);
        } catch {}
      }

      if (command.id) {
        await AnticheatService.logCommand(
          command.id,
          message,
          message.content,
          true
        );
      }
    }
  }
}
