import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class Help extends BaseCommand {
  names = ["help"];
  description = "Shows you the help center.";
  usage = ["$CMD$", "$CMD$ [command/topic]"];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[],
    isDm: boolean
  ): Promise<void> {
    let prefix: string;
    if (!isDm) {
      const guild = this.zephyr.guilds.get(msg.guildID!);
      prefix = this.zephyr.getPrefix(guild!.id);
    } else prefix = ".";

    const commands = this.zephyr.commandLib.commands;
    const query = options[0]?.toLowerCase();

    if (query) {
      const findCommand = commands.filter((c) => c.names.includes(query))[0];
      if (findCommand) {
        let description = `**${findCommand.names[0]}**\n${findCommand.description}\n`;
        if (findCommand.developerOnly)
          description += `**Developer-only command!**\n`;

        if (findCommand.usage.length > 0) {
          description +=
            `\n**Usage**` +
            `\n\`\`\`` +
            `\n${findCommand.usage
              .map(
                (u) =>
                  `${u.replace(/\$CMD\$/g, `${prefix}${findCommand.names[0]}`)}`
              )
              .join("\n")}` +
            `\n\`\`\``;
        }
        if (findCommand.subcommands.length > 0) {
          description +=
            `\n**Subcommands**` +
            `\n\`\`\`` +
            `\n${findCommand.subcommands
              .map((s) => `${prefix}${findCommand.names[0]} ${s}`)
              .join("\n")}` +
            `\n\`\`\``;
        }
        if (findCommand.names.length > 1) {
          description +=
            `\n**Aliases**` +
            `\n\`\`\`` +
            `\n${findCommand.names
              .slice(1)
              .map((n) => `${prefix}${n}`)
              .join(", ")}` +
            `\n\`\`\``;
        }
        const embed = new MessageEmbed()
          .setAuthor(`Help | ${msg.author.tag}`, msg.author.avatarURL)
          .setDescription(description);

        await msg.channel.createMessage({ embed });
        return;
      } else throw new ZephyrError.InvalidHelpQueryError();
    }

    const embed = new MessageEmbed()
      .setAuthor(`Help | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(
        `Type \`${prefix}help command\` to see more information about a command.`
      )
      .addField({
        name: "Basic",
        value: `\`daily\`, \`drop\`, \`burn\`, \`profile\``,
        inline: true,
      })
      .addField({
        name: `Collection`,
        value: `\`inventory\`, \`view\`, \`dyes\`, \`dye\`, \`items\`, \`craft\`, \`resetframe\`, \`upgrade\`, \`cardinfo\``,
        inline: true,
      })
      .addField({
        name: `Tags`,
        value: `\`viewtags\`, \`createtag\`, \`deletetag\`, \`edittag\`, \`tag\`, \`untag\`, \`burntag\`, \`burnuntagged\``,
        inline: true,
      })
      .addField({
        name: `Information`,
        value: `\`timers\`, \`reminders\`, \`lookup\`, \`recipes\`, \`previewframe\`, \`top\`, \`topgroup\`, \`topwishlist\``,
        inline: true,
      })
      .addField({
        name: `Profile`,
        value: `\`blurb\`, \`private\`, \`bank\`, \`userinfo\``,
        inline: true,
      })
      .addField({
        name: `Wishlist`,
        value: `\`wishlist [add/remove/clear]\``,
        inline: true,
      })
      .addField({
        name: `Economy`,
        value: `\`pay\`, \`frameshop\`, \`gift\`, \`giveitem\`, \`trade\``,
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

    await msg.channel.createMessage({ embed });
  }
}
