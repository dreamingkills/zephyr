import { Message, PartialEmoji } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class Pay extends BaseCommand {
  names = ["pay", "venmo", "paypal", "cashapp"];
  description = "Gives someone some money.";
  usage = ["$CMD$ <@user> <amount>"];

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    const user = msg.mentions[0];
    if (user.id === msg.author.id)
      throw new ZephyrError.CannotPayYourselfError();

    const target = await ProfileService.getProfile(user.id);

    if (target.blacklisted)
      throw new ZephyrError.AccountBlacklistedOtherError();

    const amount = parseInt(options.filter((p) => !isNaN(parseInt(p, 10)))[0]);

    if (isNaN(amount) || amount < 1)
      throw new ZephyrError.InvalidAmountError("bits");

    if (profile.bits < amount)
      throw new ZephyrError.NotEnoughBitsError(profile.bits, amount);

    const embed = new MessageEmbed()
      .setAuthor(`Pay | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(
        `Really give ${
          this.zephyr.config.discord.emoji.bits
        } **${amount.toLocaleString()}** to **${user.tag}**?`
      );

    const conf = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
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

      await conf.edit({
        embed: embed.setFooter(`💸 You've paid successfully.`),
      });

      collector.stop();
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This payment confirmation has expired.`),
        });
      }

      try {
        await conf.removeReactions();
      } catch {}
    });

    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);
  }
}
