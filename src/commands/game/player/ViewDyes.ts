import { Message, PartialEmoji } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameDye } from "../../../structures/game/Dye";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";

export default class ViewDyes extends BaseCommand {
  names = ["dyes"];
  description = "Shows you the dyes you own.";
  allowDm = true;

  private renderDyes(dyes: GameDye[]): string {
    const longestIdentifier = dyes
      .map((d) => `$${d.id.toString(36)}`)
      .reduce((a, b) => {
        return a.length > b.length ? a : b;
      }).length;
    return dyes
      .map(
        (d) =>
          `\`${`$${d.id.toString(36)}`.padStart(longestIdentifier, " ")}\` ${
            d.name
          } [**${d.charges}**]`
      )
      .join("\n");
  }

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let target;
    let targetUser;
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (!isNaN(parseInt(options[0]))) {
      if (options[0].length < 17) throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(options[0]);
    } else {
      targetUser = msg.author;
      target = profile;
    }

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    if (!target) target = await ProfileService.getProfile(targetUser.id);

    let page = 1;

    const dyeCount = await ProfileService.getUserDyeCount(target);
    const dyes = await ProfileService.getUserDyes(target, page);

    const maxPage = Math.ceil(dyeCount / 10);

    const embed = new MessageEmbed()
      .setAuthor(`Dyes | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setTitle(`${targetUser.tag}'s Dyes`)
      .setDescription(
        dyeCount > 0 ? this.renderDyes(dyes) : `${targetUser.tag} has no dyes!`
      )
      .setFooter(
        `Page ${page.toLocaleString()} of ${maxPage.toLocaleString()} • ${dyeCount.toLocaleString()} dye${
          dyeCount === 1 ? `` : `s`
        }`
      );
    const sent = await msg.channel.createMessage({ embed });

    if (maxPage > 1) {
      const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
        userId === msg.author.id;

      const collector = new ReactionCollector(this.zephyr, sent, filter, {
        time: 2 * 60 * 1000,
      });

      collector.on(
        "collect",
        async (_m: Message, emoji: PartialEmoji, userId: string) => {
          if (emoji.name === "⏮️" && page !== 1) page = 1;
          if (emoji.name === "◀️" && page !== 1) page--;
          // numbers
          if (emoji.name === "▶️" && page !== maxPage) page++;
          if (emoji.name === "⏭️" && page !== maxPage) page = maxPage;

          const newDyes = await ProfileService.getUserDyes(profile, page);

          embed.setDescription(this.renderDyes(newDyes));
          embed.setFooter(
            `Page ${page.toLocaleString()} of ${maxPage.toLocaleString()} • ${dyeCount.toLocaleString()} dye${
              dyeCount === 1 ? `` : `s`
            }`
          );

          await sent.edit({ embed });

          if (checkPermission("manageMessages", msg.channel, this.zephyr))
            await sent.removeReaction(emoji.name, userId);
        }
      );

      try {
        if (maxPage > 2) sent.addReaction(`⏮️`);
        if (maxPage > 1) sent.addReaction(`◀️`);
        // board.addReaction(`🔢`),
        if (maxPage > 1) sent.addReaction(`▶️`);
        if (maxPage > 2) sent.addReaction(`⏭️`);
      } catch (e) {}
    }
  }
}
