import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { Profile } from "../../structures/game/Profile";

export default class Help extends BaseCommand {
  names = ["help"];
  description = "Shows you the help center.";
  usage = ["$CMD$", "$CMD$ [command/topic]"];
  async exec(msg: Message, _profile: Profile): Promise<void> {
    const commands = this.zephyr.commandLib.commands;
    const query = this.options[0]?.toLowerCase();

    if (query) {
      const findCommand = commands.filter((c) => c.names.includes(query))[0];
      if (findCommand) {
        let description = `${findCommand.description}\n`;

        if (findCommand.usage.length > 1) {
          description +=
            `\n**Usage**` +
            `\n\`\`\`` +
            `\n${findCommand.usage
              .map((u) => u.replace(/\$CMD\$/g, findCommand.names[0]))
              .join("\n")}` +
            `\n\`\`\``;
        }
        if (findCommand.names.length > 1) {
          description +=
            `\n**Aliases**` +
            `\n\`\`\`` +
            `\n${findCommand.names.slice(1).join(", ")}` +
            `\n\`\`\``;
        }
        if (findCommand.subcommands.length > 0) {
          description +=
            `\n**Subcommands**` +
            `\n\`\`\`` +
            `\n${findCommand.subcommands.join("\n")}` +
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
