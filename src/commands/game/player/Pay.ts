import { Message, PartialEmoji, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { strToInt } from "../../../lib/utility/text/TextUtils";
import { checkPermission, isDeveloper } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class Pay extends BaseCommand {
  id = `silvera`;
  names = [`pay`, `venmo`, `paypal`, `cashapp`];
  description = `Gives someone some money.`;
  usage = [`$CMD$ <@user> <amount>`];

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!Zephyr.flags.transactions && !isDeveloper(msg.author))
      throw new ZephyrError.TransactionFlagDisabledError();

    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    const user = msg.mentions[0];
    if (user.id === msg.author.id)
      throw new ZephyrError.CannotPayYourselfError();

    if (!options[1]) throw new ZephyrError.InvalidAmountOfBitsError();

    const target = await ProfileService.getProfile(user.id);

    if (target.blacklisted)
      throw new ZephyrError.AccountBlacklistedOtherError();

    const amount = strToInt(options.filter((p) => !isNaN(parseInt(p, 10)))[0]);

    if (isNaN(amount) || amount < 1)
      throw new ZephyrError.InvalidAmountOfBitsError();

    if (profile.bits < amount) throw new ZephyrError.NotEnoughBitsError(amount);

    const embed = new MessageEmbed(`Pay`, msg.author).setDescription(
      `Really give ${
        Zephyr.config.discord.emoji.bits
      } **${amount.toLocaleString()}** to **${user.tag}**?`
    );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    collector.on("collect", async () => {
      await ProfileService.removeBitsFromProfile(profile, amount);
      await ProfileService.addBitsToProfile(target, amount);

      await AnticheatService.logBitTransaction(
        profile,
        target,
        amount,
        msg.guildID!
      );

      await confirmation.edit({
        embed: embed.setFooter(`💸 You've paid successfully.`),
      });

      collector.stop();
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This confirmation has expired.`),
        });
      }

      if (checkPermission(`manageMessages`, msg.channel))
        await confirmation.removeReactions();
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
