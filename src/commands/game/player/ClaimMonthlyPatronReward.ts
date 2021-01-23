import dayjs from "dayjs";
import { Message } from "eris";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { items } from "../../../assets/items";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { PatreonService } from "../../../lib/database/services/meta/PatreonService";
import { PrefabItem } from "../../../structures/item/PrefabItem";

export default class ClaimMonthlyPatronReward extends BaseCommand {
  names = ["monthly"];
  description = "Claims your monthly Patreon reward.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (profile.patron < 1) throw new ZephyrError.NotAPatronError();

    const information = await PatreonService.getPatronInformation(profile);

    if (!information.nextFrameTime) {
      const frameVoucherItem = items.filter((i) =>
        i.names.includes("Patron Frame Voucher")
      )[0] as PrefabItem;

      await ProfileService.addItems(profile, [
        { item: frameVoucherItem, count: 1 },
      ]);
      await PatreonService.setNextPatreonClaimTime(profile);

      const embed = new MessageEmbed()
        .setAuthor(
          `Patron Reward | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(`You claimed **1x** \`${frameVoucherItem.names[0]}\`!`);

      await this.send(msg.channel, embed);
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

        await this.send(msg.channel, embed);
        return;
      } else {
        const frameVoucherItem = items.filter((i) =>
          i.names.includes("Patron Frame Voucher")
        )[0] as PrefabItem;

        await ProfileService.addItems(profile, [
          { item: frameVoucherItem, count: 1 },
        ]);
        await PatreonService.setNextPatreonClaimTime(profile);

        const embed = new MessageEmbed()
          .setAuthor(
            `Patron Reward | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `You claimed **1x** \`${frameVoucherItem.names[0]}\`!`
          );

        await this.send(msg.channel, embed);
        return;
      }
    }
  }
}
