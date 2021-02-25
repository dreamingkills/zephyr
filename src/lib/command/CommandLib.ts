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
        if (!cmdExport.default) continue;

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

    const commandMatch = this.commands.filter((c) =>
      c.names.includes(commandName)
    );
    if (!commandMatch[0]) return;

    if (commandMatch.length > 1)
      console.warn(`Duplicate command found: ${commandName}`);

    const command = commandMatch[0];

    if (
      command.developerOnly &&
      !zephyr.config.developers.includes(message.author.id)
    ) {
      const embed = new MessageEmbed(`Error`, message.author).setDescription(
        `This command is only usable by the developer.`
      );
      try {
        await createMessage(message.channel, embed);
      } catch {
      } finally {
        return;
      }
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

        if (now < creationDate.add(14, `day`) && zephyr.logChannel) {
          await createMessage(
            zephyr.logChannel,
            `:warning: New account (<2 weeks) joined: **${
              message.author.tag
            }** (${message.author.id})\nCreation date: ${creationDate.format(
              `YYYY-MM-DD HH:mm:ss`
            )}\nGuild created in: **${message.guildID || `DMs`}**`
          );
        }
      }

      if (profile.blacklisted) throw new ZephyrError.AccountBlacklistedError();
      if (message.channel.type === 1 && !command.allowDm)
        throw new ZephyrError.NotAllowedInDMError();

      await command.run(message, profile, zephyr);
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
        console.log(`ERROR NAME: ${e}\n${e.stack}`);
        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          `An unexpected error occurred. Please try again.`
        );
        try {
          await createMessage(message.channel, embed);
        } catch {}
      }
    }
  }
}
