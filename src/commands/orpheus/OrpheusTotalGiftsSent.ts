import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { checkPermission } from "../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { isValidSnowflake } from "../../lib/utility/text/TextUtils";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { OrpheusService } from "../../lib/database/services/orpheus/OrpheusService";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusTotalGiftsSent extends BaseCommand {
  id = `skyland`;
  names = [`ops_tgs`];
  description = `Shows a list of users who have received gifts from a person.`;
  usage = [`$CMD$ <@mention/user id>`];
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
      if (!isValidSnowflake(options[0]))
        throw new ZephyrError.InvalidSnowflakeError();

      const fetchUser = await Zephyr.fetchUser(options[0]);

      if (!fetchUser) throw new ZephyrError.UserNotFoundError();

      target = fetchUser;
    } else target = msg.author;

    const gifts = await OrpheusService.getGiftsSent(target);
    const total: { [key: string]: number } = {};

    for (let gift of gifts) {
      if (total[gift.recipient]) {
        total[gift.recipient] += 1;
      } else {
        total[gift.recipient] = 1;
      }
    }

    const totalArray = Object.entries(total).sort((a, b) => b[1] - a[1]);

    const pageLimit = Math.ceil(totalArray.length / 10);

    let page = 1;

    const giftDescriptions = this.renderGifts(
      totalArray.slice(page * 10 - 10, page * 10)
    );

    const embed = new MessageEmbed(`Orpheus Total Gifts Sent`, msg.author)
      .setTitle(`${target.tag}'s sent gifts (${target.id})`)
      .setDescription(giftDescriptions.join(`\n`))
      .setFooter(
        `Page ${page} of ${pageLimit.toLocaleString()} • ${gifts.length.toLocaleString()} gifts`
      );

    const giftsMessage = await this.send(msg.channel, embed);

    if (pageLimit <= 1) return;

    const filter = (_m: Message, _emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id;
    const collector = new ReactionCollector(Zephyr, giftsMessage, filter, {
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
        if (emoji.name === "▶" && page !== pageLimit) page++;
        if (emoji.name === "⏭" && page !== pageLimit) page = pageLimit;

        embed.setDescription(
          this.renderGifts(totalArray.slice(page * 10 - 10, page * 10)).join(
            `\n`
          )
        );
        embed.setFooter(
          `Page ${page} of ${pageLimit} • ${gifts.length} entries`
        );
        await this.edit(giftsMessage, embed);

        if (checkPermission("manageMessages", msg.textChannel))
          await giftsMessage.removeReaction(emoji.name, user.id);
      }
    );

    if (pageLimit > 2) await this.react(giftsMessage, `⏮`);
    if (pageLimit > 1) await this.react(giftsMessage, `◀`);
    if (pageLimit > 1) await this.react(giftsMessage, `▶`);
    if (pageLimit > 2) await this.react(giftsMessage, `⏭`);
  }

  private renderGifts(gifts: [string, number][]): string[] {
    const giftDescriptions = [];
    for (let gift of gifts) {
      giftDescriptions.push(
        `\`${gift[0].padStart(
          18,
          ` `
        )}\` — **${gift[1].toLocaleString()}** gifts`
      );
    }

    return giftDescriptions;
  }
}
