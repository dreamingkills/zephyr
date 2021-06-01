import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { checkPermission } from "../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusSearch extends BaseCommand {
  id = `lovesick`;
  names = ["ops_search"];
  description = `Searches all loaded Zephyr players by username.`;
  usage = ["$CMD$", "$CMD$ <search term> [--no-blacklisted]"];
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

    if (!options[0]) {
      const embed = new MessageEmbed(`Error`, msg.author).setDescription(
        `Please enter a search query.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    let showBlacklisted = true;
    let lowercaseSearch = options.map((o) => o.toLowerCase());

    if (lowercaseSearch.includes(`--no-blacklisted`)) {
      showBlacklisted = false;
      lowercaseSearch = lowercaseSearch.filter(
        (s) => !s.includes(`--no-blacklisted`)
      );
    }

    const searchTerm = lowercaseSearch.join(` `);

    const usersMatched = Zephyr.users.filter((u) =>
      u.username.toLowerCase().includes(searchTerm)
    );

    if (usersMatched.length > 250) {
      const embed = new MessageEmbed(`Error`, msg.author).setDescription(
        `Too many results. Please narrow your search down.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const usersPlayed: User[] = [];

    for (let user of usersMatched) {
      try {
        const profile = await ProfileService.getProfile(user.id);

        if (!showBlacklisted && profile.blacklisted) continue;

        usersPlayed.push(user);
      } catch {
        continue;
      }
    }

    let page = 1;
    const maxPage = Math.ceil(usersPlayed.length / 25);

    const embed = new MessageEmbed(`Orpheus User Search`, msg.author)
      .setDescription(
        this.renderUsers(usersPlayed.slice(25 * page - 25, 25 * page)).join(
          `\n`
        )
      )
      .setFooter(`Page ${page} of ${maxPage} • ${usersPlayed.length} users`);

    const sent = await this.send(msg.channel, embed);

    if (maxPage < 2) return;

    const filter = (_m: Message, _emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id;

    const collector = new ReactionCollector(Zephyr, sent, filter, {
      time: 2 * 60 * 1000,
    });

    collector.on("error", async (e: Error) => {
      console.error(e);
      await this.handleError(msg, msg.author, e);
    });

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, user: User) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== maxPage) page++;
        if (emoji.name === "⏭" && page !== maxPage) page = maxPage;

        const newUsers = this.renderUsers(
          usersPlayed.slice(page * 25 - 25, page * 25)
        );

        embed.setDescription(newUsers.join(`\n`));
        embed.setFooter(
          `Page ${page} of ${maxPage} • ${usersPlayed.length} entries`
        );

        await this.edit(sent, embed);

        if (checkPermission("manageMessages", msg.textChannel))
          await sent.removeReaction(emoji.name, user.id);
      }
    );

    if (maxPage > 2) await this.react(sent, `⏮`);
    if (maxPage > 1) await this.react(sent, `◀`);
    if (maxPage > 1) await this.react(sent, `▶`);
    if (maxPage > 2) await this.react(sent, `⏭`);
  }

  private renderUsers(users: User[]): string[] {
    return users.map((u) => `- \`${u.id}\` ${u.tag}`);
  }
}
