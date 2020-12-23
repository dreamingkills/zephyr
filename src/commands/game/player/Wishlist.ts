import { Message, TextChannel, User } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { GameBaseCard } from "../../../structures/game/BaseCard";
import { MessageCollector } from "eris-collector";

export default class Wishlist extends BaseCommand {
  names = ["wishlist", "wl"];
  description = "Shows your, or someone else's, wishlist.";
  usage = ["$CMD$", "$CMD$ <@user>", "$CMD$ <id>"];
  subcommands = ["add <name>", "delete/remove <number / text>", "clear"];

  private async add(
    query: { group?: string; name: string },
    author: User,
    profile: GameProfile,
    channel: TextChannel
  ): Promise<void> {
    await ProfileService.addToWishlist(profile, query.name, query.group);

    const embed = new MessageEmbed()
      .setAuthor(`Wishlist | ${author.tag}`, author.dynamicAvatarURL("png"))
      .setDescription(
        `Added ${query.group ? `**${query.group}** ` : ``}${
          query.name
        } to your wishlist.`
      );
    await channel.createMessage({ embed });
    return;
  }

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const subcommand = this.options[0]?.toLowerCase();
    let target: GameProfile | undefined;
    let targetUser: User | undefined;
    if (subcommand === "add") {
      const wishlist = await ProfileService.getWishlist(profile);
      if (
        (wishlist.length >= 5 && profile.patron === 0) ||
        (wishlist.length >= 10 && profile.patron === 1) ||
        (wishlist.length >= 15 && profile.patron === 2) ||
        (wishlist.length >= 20 && profile.patron === 3) ||
        (wishlist.length >= 25 && profile.patron === 4)
      ) {
        const prefix = this.zephyr.getPrefix(msg.guildID!);
        throw new ZephyrError.WishlistFullError(profile.patron, prefix);
      }

      const nameQuery = this.options.slice(1).join(" ")?.trim().toLowerCase();
      const find = this.zephyr
        .getCards()
        .filter((c) => c.name.toLowerCase() === nameQuery);

      let unique: GameBaseCard[] = [];
      find.forEach((c) => {
        if (!unique.filter((u) => u.group === c.group)[0]) unique.push(c);
      });
      for (let u of unique) {
        const match = wishlist.filter(
          (wl) =>
            wl.groupName?.toLowerCase() === u.group?.toLowerCase() &&
            wl.name.toLowerCase() === u.name.toLowerCase()
        )[0];
        if (match) unique.splice(unique.indexOf(u), 1);
      }

      if (!unique[0]) throw new ZephyrError.InvalidWishlistNameError();

      if (unique.length > 1) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Wishlist | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `I found multiple matches for **${unique[0].name}**.\nPlease reply with a number to confirm which person you're talking about.\n` +
              unique
                .map(
                  (u, index) =>
                    `— \`${index + 1}\` ${u.group ? `**${u.group}** ` : ``}${
                      u.name
                    }`
                )
                .join("\n")
          );

        const conf = await msg.channel.createMessage({ embed });

        const filter = (m: Message) =>
          unique[parseInt(m.content) - 1] && m.author.id === msg.author.id;
        const collector = new MessageCollector(
          this.zephyr,
          msg.channel,
          filter,
          { time: 15000, max: 1 }
        );
        collector.on("collect", async (m: Message) => {
          const index = unique[parseInt(m.content) - 1];
          const match = wishlist.filter(
            (wl) =>
              wl.name.toLowerCase() === index.name.toLowerCase() &&
              wl.groupName?.toLowerCase() === index.group?.toLowerCase()
          )[0];
          if (match) throw new ZephyrError.DuplicateWishlistEntryError();
          await this.add(
            { group: index.group, name: index.name },
            msg.author,
            profile,
            msg.channel as TextChannel
          );
        });
        collector.on("end", async (_c: any, reason: string) => {
          if (reason === "time") {
            await conf.edit({
              embed: embed.setFooter(`This addition has timed out.`),
            });
          }
        });
      } else {
        const match = wishlist.filter(
          (wl) =>
            wl.name.toLowerCase() === unique[0].name.toLowerCase() &&
            wl.groupName?.toLowerCase() === unique[0].group?.toLowerCase()
        )[0];
        if (match) throw new ZephyrError.DuplicateWishlistEntryError();
        await this.add(
          { group: unique[0].group, name: unique[0].name },
          msg.author,
          profile,
          msg.channel as TextChannel
        );
      }
      return;
    } else if (subcommand === "delete" || subcommand === "remove") {
      const wishlist = await ProfileService.getWishlist(profile);
      let num = parseInt(this.options[1], 10);

      if (isNaN(num)) {
        if (this.options[1]) {
          const query = this.options.slice(1)?.join(" ").toLowerCase();
          const item = wishlist.filter((i) => i.name.toLowerCase() === query);
          if (item[0]) {
            const index = wishlist.indexOf(item[0]);
            await ProfileService.removeFromWishlist(profile, index + 1);
            const embed = new MessageEmbed()
              .setAuthor(
                `Wishlist | ${msg.author.tag}`,
                msg.author.dynamicAvatarURL("png")
              )
              .setDescription(
                `Removed ${
                  item[0].groupName ? `**${item[0].groupName}** ` : ``
                }${item[0].name} from your wishlist.`
              );
            await msg.channel.createMessage({ embed });
            return;
          }
        } else throw new ZephyrError.InvalidWishlistEntryError();
      }

      const target = wishlist[num - 1];
      if (!target) throw new ZephyrError.InvalidWishlistEntryError();

      await ProfileService.removeFromWishlist(profile, num);
      const embed = new MessageEmbed()
        .setAuthor(
          `Wishlist | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `Removed ${target.groupName ? `**${target.groupName}** ` : ``}${
            target.name
          } from your wishlist.`
        );
      await msg.channel.createMessage({ embed });
      return;
    } else if (subcommand === "clear") {
      const wishlist = await ProfileService.getWishlist(profile);
      if (wishlist.length === 0) throw new ZephyrError.WishlistEmptyError();

      await ProfileService.clearWishlist(profile);
      const embed = new MessageEmbed()
        .setAuthor(
          `Wishlist | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(`Cleared your wishlist.`);
      await msg.channel.createMessage({ embed });
      return;
    }
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (!isNaN(parseInt(this.options[0]))) {
      if (this.options[0].length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(this.options[0]);
    } else {
      target = profile;
      targetUser = msg.author;
    }

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    if (!target) target = await ProfileService.getProfile(targetUser.id);
    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const wishlist = await ProfileService.getWishlist(target);
    let index = 1;
    const embed = new MessageEmbed()
      .setAuthor(
        `Wishlist | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${targetUser.tag}'s Wishlist`)
      .setDescription(
        wishlist.length === 0
          ? `This wishlist is empty!`
          : `${wishlist
              .map((i) => {
                return `\`${(index++)
                  .toString()
                  .padStart(wishlist.length.toString().length)}\` ${
                  i.groupName ? `**${i.groupName}** ` : ``
                }${i.name}`;
              })
              .join("\n")}`
      )
      .setFooter(
        `Use ${this.zephyr.getPrefix(
          msg.guildID
        )}help wishlist for more information!`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
