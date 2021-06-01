import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { checkPermission } from "../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { isValidSnowflake } from "../../lib/utility/text/TextUtils";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { OrpheusService } from "../../lib/database/services/orpheus/OrpheusService";
import { OrpheusGift } from "../../structures/orpheus/OrpheusGift";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusGifts extends BaseCommand {
  id = `merry`;
  names = [`ops_gifts`];
  description = `Shows a user's gift history.`;
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

    const gifts = await OrpheusService.getGifts(target);
    const pageLimit = Math.ceil(gifts.length / 10);

    let page = 1;

    const giftDescriptions = this.renderGifts(
      gifts.slice(page * 10 - 10, page * 10),
      target
    );

    const embed = new MessageEmbed(`Orpheus Gifts`, msg.author)
      .setTitle(`${target.tag}'s gift history (${target.id})`)
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
          this.renderGifts(gifts.slice(page * 10 - 10, page * 10), target).join(
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

  private renderGifts(gifts: OrpheusGift[], user: User): string[] {
    const giftDescriptions = [];
    for (let gift of gifts) {
      const isGiver = user.id === gift.giver;

      if (isGiver) {
        giftDescriptions.push(
          `📨 \`${gift.card_id.toString(36)}\` sent to **${
            gift.recipient
          }** [ID ${gift.id}]`
        );
      } else {
        giftDescriptions.push(
          `📫 \`${gift.card_id.toString(36)}\` received from **${
            gift.giver
          }** [ID ${gift.id}]`
        );
      }
    }

    return giftDescriptions;
  }
}
