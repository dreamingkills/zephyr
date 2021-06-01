import { Message, User } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { Zephyr } from "../../structures/client/Zephyr";

export default class Help extends BaseCommand {
  id = `orion`;
  names = [`help`];
  description = `Shows you the help center.`;
  usage = [`$CMD$`, `$CMD$ [command/topic]`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let prefix: string;

    if (msg.guildID) {
      const guild = Zephyr.guilds.get(msg.guildID!);
      prefix = Zephyr.getPrefix(guild!.id);
    } else prefix = `.`;

    const commandLib = Zephyr.commandLib;

    const query = options[0]?.toLowerCase();
    if (!query) {
      await this.send(msg.channel, this.generateHelpCenter(prefix, msg.author));

      return;
    }

    const command = commandLib.getCommand(query);
    if (!command) throw new ZephyrError.InvalidHelpQueryError();

    const embed = this.generateCommandHelp(prefix, command, msg.author);

    await this.send(msg.channel, embed);

    return;
  }

  private generateHelpCenter(prefix: string, user: User): MessageEmbed {
    return new MessageEmbed(`Help`, user)
      .setDescription(
        `Type \`${prefix}help command\` to see more information about a command.\n**Need more help or just want to chat?** Join __Zephyr Community__ by [clicking here](https://discord.gg/zephyr)!`
      )
      .setFooter(`User ID: ${user.id}`)
      .addField({
        name: "Basic",
        value: `\`daily\`, \`drop\`, \`burn\`, \`profile\`, \`balance\`, \`quests\`, \`mysterybox\``,
        inline: true,
      })
      .addField({
        name: `Collection`,
        value: `\`inventory\`, \`view\`, \`dyes\`, \`dye\`, \`items\`, \`craft\`, \`resetframe\`, \`upgrade\`, \`cardinfo\``,
        inline: true,
      })
      .addField({
        name: `Tags`,
        value: `\`viewtags\`, \`createtag\`, \`deletetag\`, \`edittag\`, \`tag\`, \`untag\`, \`burntag\`, \`burnuntagged\`, \`createautotag\`, \`deleteautotag\`, \`autotags\`, \`changepriority\``,
        inline: true,
      })
      .addField({
        name: `Information`,
        value: `\`timers\`, \`reminders\`, \`lookup\`, \`recipes\`, \`iteminfo\`, \`previewsticker\`, \`topwishlist\`, \`grouplist\`, \`birthdays\``,
        inline: true,
      })
      .addField({
        name: `Profile`,
        value: `\`blurb\`, \`private\`, \`userinfo\`, \`badges\`, \`badge\``,
        inline: true,
      })
      .addField({
        name: `Vault`,
        value: `\`vault\`, \`vaultadd\`, \`vaultremove\`, \`vaultcards\``,
        inline: true,
      })
      .addField({
        name: `Wishlist`,
        value: `\`wishlist\`, \`wishadd\`, \`wishremove\`, \`wishclear\``,
        inline: true,
      })
      .addField({
        name: `Economy`,
        value: `\`pay\`, \`shop\`, \`gift\`, \`trade\`, \`multitrade\``,
        inline: true,
      })
      .addField({
        name: `Album`,
        value: `\`album\`, \`albums\`, \`renamealbum\`, \`addcardtoalbum\`, \`removecardfromalbum\`, \`clearalbum\``,
        inline: true,
      })
      .addField({
        name: `Clubs`,
        value: `\`abandon\`, \`members\`, \`clubsettings\`, \`createclub\`, \`demote\`, \`join\`, \`kick\`, \`leave\`, \`myclubs\`, \`promote\`, \`club\``,
        inline: true,
      })
      .addField({
        name: `Misc`,
        value: `\`patreon\`, \`stats\`, \`vote\``,
        inline: true,
      })
      .addField({
        name: `Setup`,
        value: `\`setchannel\`, \`prefix\``,
        inline: true,
      });
  }

  private generateCommandHelp(
    prefix: string,
    command: BaseCommand,
    user: User
  ): MessageEmbed {
    let description = `**${command.names[0]}**\n${command.description}\n`;
    if (command.developerOnly) description += `**Developer-only command!**\n`;

    if (command.usage.length > 0) {
      description +=
        `\n**Usage**` +
        `\n\`\`\`` +
        `\n${command.usage
          .map(
            (u) => `${u.replace(/\$CMD\$/g, `${prefix}${command.names[0]}`)}`
          )
          .join("\n")}` +
        `\n\`\`\``;
    }
    if (command.subcommands.length > 0) {
      description +=
        `\n**Subcommands**` +
        `\n\`\`\`` +
        `\n${command.subcommands
          .map((s) => `${prefix}${command.names[0]} ${s}`)
          .join("\n")}` +
        `\n\`\`\``;
    }
    if (command.names.length > 1) {
      description +=
        `\n**Aliases**` +
        `\n\`\`\`` +
        `\n${command.names
          .slice(1)
          .map((n) => `${prefix}${n}`)
          .join(", ")}` +
        `\n\`\`\``;
    }

    const embed = new MessageEmbed(`Help`, user).setDescription(description);

    if (Zephyr.config.developers.includes(user.id)) {
      embed.setFooter(`Command ID: ${command.id || `none`}`);
    }

    return embed;
  }
}
