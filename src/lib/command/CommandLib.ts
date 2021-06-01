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
import { getActiveQuests } from "../database/sql/game/quest/QuestGetter";
import { initQuests } from "../database/sql/game/quest/QuestSetter";
import { StatsD } from "../StatsD";

export class CommandLib {
  commands: Map<string, BaseCommand> = new Map();
  aliases: Map<string, string> = new Map();

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

        cmd.path = f;

        const primaryName = cmd.names[0];
        this.commands.set(primaryName, cmd);

        for (let name of cmd.names.slice(1)) {
          this.aliases.set(name, primaryName);
        }
      } catch {
        continue;
      }
    }
  }

  async process(message: Message): Promise<void> {
    const isDm = !message.guildID;

    let prefix = Zephyr.getPrefix(message.guildID).toLowerCase();

    if (!message.content.toLowerCase().startsWith(prefix)) return;

    const commandNameQuery = message.content
      .toLowerCase()
      .split(` `)[0]
      .slice(prefix.length);

    const command = this.getCommand(commandNameQuery);

    if (!command) return;

    const isDeveloper = Zephyr.config.developers.includes(message.author.id);
    const isMod = Zephyr.config.moderators.includes(message.author.id);

    try {
      if (Zephyr.maintenance.enabled && !isDeveloper && !isMod)
        throw new ZephyrError.MaintenanceError(``);

      if (command.disabled && !isDeveloper && !isMod)
        throw new ZephyrError.CommandDisabledError(command.disabledMessage);

      if (isDm && !command.allowDm) {
        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          `You cannot use that command in DMs.`
        );

        await createMessage(message.channel, embed);
        return;
      }

      if (command.developerOnly && !isDeveloper) {
        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          `This command is only usable by the developer.`
        );

        try {
          await createMessage(message.channel, embed);
        } catch {}

        return;
      } else if (command.moderatorOnly && !isDeveloper && !isMod) {
        const embed = new MessageEmbed(`Error`, message.author).setDescription(
          `This command is only usable by Zephyr staff.`
        );

        try {
          await createMessage(message.channel, embed);
        } catch {}

        return;
      }

      let profile: GameProfile;
      try {
        profile = await ProfileService.getProfile(message.author.id);
      } catch {
        profile = await ProfileService.getProfile(message.author.id, true);

        StatsD.increment(`zephyr.profile.created`, 1);

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

      if (!isMod) {
        if (Zephyr.onCooldown.has(message.author.id)) return;

        Zephyr.onCooldown.add(message.author.id);
        setTimeout(
          () => Zephyr.onCooldown.delete(message.author.id),
          Zephyr.modifiers.globalRateLimit
        );
      }

      const quests = await getActiveQuests(profile);

      if (
        quests.length <
        Zephyr.modifiers.dailyQuestLimit + Zephyr.modifiers.weeklyQuestLimit
      )
        await initQuests(profile, quests);

      const startExec = Date.now();

      await command.run(message, profile);

      StatsD.timing(
        `zephyr.command.responsetime`,
        Date.now() - message.createdAt
      );
      StatsD.timing(`zephyr.command.execute`, Date.now() - startExec);

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
        const embed = new MessageEmbed(
          e.header || `Error`,
          message.author
        ).setDescription(e.message);

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

  public getCommand(name: string): BaseCommand | undefined {
    if (this.commands.has(name)) return this.commands.get(name);

    const alias = this.aliases.get(name);

    if (!alias) return;

    return this.commands.get(alias);
  }

  public reloadCommand(command: BaseCommand): void {
    if (!command.path) throw new ZephyrError.InvalidCommandPathError();

    delete require.cache[require.resolve(command.path)];

    const newCommandExport = require(command.path);

    if (!newCommandExport.default) throw new ZephyrError.NoDefaultExportError();

    const newCommand = new newCommandExport.default(Zephyr) as BaseCommand;

    newCommand.path = command.path;

    this.commands.delete(command.names[0]);

    for (let name of command.names) {
      this.aliases.delete(name);
    }

    const primaryName = newCommand.names[0];
    this.commands.set(primaryName, newCommand);

    for (let name of newCommand.names.slice(1)) {
      this.aliases.set(name, primaryName);
    }
  }
}
