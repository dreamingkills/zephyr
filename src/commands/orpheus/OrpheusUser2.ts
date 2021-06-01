import { Message, User } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { OrpheusService } from "../../lib/database/services/orpheus/OrpheusService";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusUser2 extends BaseCommand {
  id = `notice`;
  names = [`ops_au2`];
  usage = [`$CMD$ <user id>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (
      !Zephyr.config.moderators.includes(msg.author.id) &&
      !Zephyr.config.developers.includes(msg.author.id)
    )
      return;

    let target: User;

    if (msg.mentions[0]) {
      target = msg.mentions[0];
    } else if (options[0]) {
      if (
        isNaN(parseInt(options[0])) ||
        options[0].length < 17 ||
        options[0].length > 18
      )
        throw new ZephyrError.InvalidSnowflakeError();

      const user = await Zephyr.fetchUser(options[0]);

      if (!user) throw new ZephyrError.UserNotFoundError();

      target = user;
    } else {
      target = msg.author;
    }

    const commandUses = await OrpheusService.getCommandUses(target);

    const times: { [key: string]: number } = {};
    const guilds: (string | null)[] = [];

    for (let use of commandUses) {
      times[new Date(use.use_time).getHours()] =
        times[new Date(use.use_time).getHours()] + 1 || 1;

      if (!guilds.includes(use.guild_id)) {
        guilds.push(use.guild_id);
      }
    }

    const embed = new MessageEmbed(`Orpheus User Analysis 2`, msg.author);

    const activeTimes = [];

    for (let i = 0; i < 24; i++) {
      const usesInHour = times[i.toString().padStart(2, `0`)] || 0;

      activeTimes.push(
        `\`${i
          .toString()
          .padStart(2, `0`)}:00\` - \`${usesInHour.toLocaleString()}\``
      );
    }

    embed.addField({
      name: `:alarm_clock: Active Time`,
      value: `\` TIME\` - \`COMMAND USES\`\n${activeTimes.join(`\n`)}`,
      inline: true,
    });

    /*
        Active Guilds
    */
    const activeGuilds = [];

    for (let guild of guilds) {
      const usesInGuild = commandUses.filter((g) => g.guild_id === guild)
        .length;

      activeGuilds.push(
        `\`${
          guild || `        DM Channel`
        }\` - \`${usesInGuild.toLocaleString()}\``
      );
    }

    embed.addField({
      name: `:shield: Active Guilds`,
      value: `\`          GUILD ID\` - \`COMMAND USES\`\n${activeGuilds.join(
        `\n`
      )}`,
      inline: true,
    });

    await this.send(msg.channel, embed);
    return;
  }
}
