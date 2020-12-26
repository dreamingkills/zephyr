import { Message } from "eris";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import items from "../../../assets/items.json";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import dayjs from "dayjs";
import { getTimeUntilNextDay } from "../../../lib/ZephyrUtils";

export default class FrameShop extends BaseCommand {
  names = ["frameshop", "fs"];
  description = "Shows you what's on sale in the frame shop.";
  subcommands = ["buy <frame name>"];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const shop = await ShopService.getFrameShop();
    const subcommand = this.options[0]?.toLowerCase();
    if (subcommand === "buy") {
      const frameName = this.options.slice(1).join(" ")?.toLowerCase();
      const itemFind = items.items.filter(
        (i) =>
          i.name.toLowerCase() === frameName + " frame" ||
          i.name.toLowerCase() === frameName
      )[0];
      if (!itemFind) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Frame Shop | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(`That item does not exist.`)
          .setFooter(`Please make sure your spelling is correct.`);
        await msg.channel.createMessage({ embed });
        return;
      }

      const frame = shop.filter(
        (f) =>
          f.frame_name.toLowerCase() === frameName ||
          f.frame_name.toLowerCase() + " frame" === frameName
      );
      if (!frame[0]) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Frame Shop | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(`That item isn't currently for sale.`);
        await msg.channel.createMessage({ embed });
        return;
      }

      if (frame[0].price > profile.bits)
        throw new ZephyrError.NotEnoughBitsError(profile.bits, frame[0].price);

      const realFrame = itemFind.name;

      await ProfileService.addItems(profile, [{ item: itemFind, count: 1 }]);
      const newProfile = await ProfileService.removeBitsFromProfile(
        profile,
        frame[0].price
      );

      const embed = new MessageEmbed()
        .setAuthor(
          `Frame Shop | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `${
            this.zephyr.config.discord.emoji.check
          } You bought a **${realFrame}** for ${
            this.zephyr.config.discord.emoji.bits
          }**${frame[0].price.toLocaleString()}**.` +
            `\n— New balance: ${
              this.zephyr.config.discord.emoji.bits
            }**${newProfile.bits.toLocaleString()}**`
        );
      await msg.channel.createMessage({ embed });
      return;
    }
    const frames = [];
    for (let frame of shop) {
      frames.push(
        `— **${frame.frame_name}** Frame ${
          this.zephyr.config.discord.emoji.bits
        }**${frame.price.toLocaleString()}**`
      );
    }

    const timeUntilNextDay = getTimeUntilNextDay(
      dayjs(new Date().setHours(0, 0, 0, 0))
    );
    const prefix = this.zephyr.getPrefix(msg.guildID!);
    const embed = new MessageEmbed()
      .setAuthor(
        `Frame Shop | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `${
          this.zephyr.config.discord.emoji.star
        } Welcome to the **Frame Shop**. Offers change every 24 hours.\n\n${frames.join(
          "\n"
        )}\n\n**See something you like?**\nUse \`${prefix}fs buy <frame>\` to make a purchase.` +
          `\nYou can also use \`${prefix}pf <frame>\` to preview a frame.`
      )
      .setFooter(`Shop resets in ${timeUntilNextDay}.`);
    await msg.channel.createMessage({ embed });
  }
}
