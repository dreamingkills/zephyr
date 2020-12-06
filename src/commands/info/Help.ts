import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Help extends BaseCommand {
  names = ["help"];
  description = "Shows you the help center.";
  usage = ["$CMD$", "$CMD$ [command/topic]"];
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const guild = this.zephyr.guilds.get(msg.guildID!);
    const prefix = this.zephyr.getPrefix(guild!.id);

    const commands = this.zephyr.commandLib.commands;
    const query = this.options[0]?.toLowerCase();

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
      }

      return;
    }
  }
}
