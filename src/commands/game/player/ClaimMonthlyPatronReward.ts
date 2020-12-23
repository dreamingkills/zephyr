import dayjs from "dayjs";
import { Message } from "eris";
import { getTimeUntil } from "../../../lib/ZephyrUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { items } from "../../../assets/items.json";
import { BaseItem } from "../../../structures/game/Item";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { PatreonService } from "../../../lib/database/services/meta/PatreonService";

export default class ClaimMonthlyPatronReward extends BaseCommand {
  names = ["monthly"];
  description = "Claims your monthly Patreon reward.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (profile.patron < 1) throw new ZephyrError.NotAPatronError();

    const information = await PatreonService.getPatronInformation(profile);

    if (!information.nextFrameTime) {
      const frameVoucherItem = items.filter(
        (i) => i.name === "Patron Frame Voucher"
      )[0] as BaseItem;

      await ProfileService.addItems(profile, [
        { item: frameVoucherItem, count: 1 },
      ]);
      await PatreonService.setNextPatreonClaimTime(profile);

      const embed = new MessageEmbed()
        .setAuthor(
          `Patron Reward | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(`You claimed **1x** \`${frameVoucherItem.name}\`!`);

      await msg.channel.createMessage({ embed });
      return;
    } else {
      const nextFrameClaim = dayjs(information.nextFrameTime).startOf("month");
      if (nextFrameClaim.isAfter(dayjs())) {
        const timeUntil = getTimeUntil(dayjs(), nextFrameClaim);
        const embed = new MessageEmbed()
          .setAuthor(
            `Patron Reward | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `You can claim your monthly reward again in **${timeUntil}**.`
          );

        await msg.channel.createMessage({ embed });
        return;
      } else {
        const frameVoucherItem = items.filter(
          (i) => i.name === "Patron Frame Voucher"
        )[0] as BaseItem;

        await ProfileService.addItems(profile, [
          { item: frameVoucherItem, count: 1 },
        ]);
        await PatreonService.setNextPatreonClaimTime(profile);

        const embed = new MessageEmbed()
          .setAuthor(
            `Patron Reward | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(`You claimed **1x** \`${frameVoucherItem.name}\`!`);

        await msg.channel.createMessage({ embed });
        return;
      }
    }
  }
}
