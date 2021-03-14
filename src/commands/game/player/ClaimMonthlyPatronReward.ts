import dayjs from "dayjs";
import { Message } from "eris";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { PatreonService } from "../../../lib/database/services/meta/PatreonService";
import { ItemService } from "../../../lib/ItemService";

export default class ClaimMonthlyPatronReward extends BaseCommand {
  id = `majesty`;
  names = ["monthly"];
  description = "Claims your monthly Patreon reward.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (profile.patron < 1) throw new ZephyrError.NotAPatronError();

    const information = await PatreonService.getPatronInformation(profile);

    if (!information.nextFrameTime) {
      const frameVoucherItem = ItemService.getItemByName(
        `Patron Frame Voucher`
      );

      if (!frameVoucherItem) throw new ZephyrError.InvalidItemError();

      await ProfileService.addItems(profile, [
        { item: frameVoucherItem, count: 1 },
      ]);
      await PatreonService.setNextPatreonClaimTime(profile);

      const embed = new MessageEmbed(
        `Patron Reward`,
        msg.author
      ).setDescription(`You claimed **1x** \`${frameVoucherItem.names[0]}\`!`);

      await this.send(msg.channel, embed);
      return;
    } else {
      const nextFrameClaim = dayjs(information.nextFrameTime).startOf("month");
      if (nextFrameClaim.isAfter(dayjs())) {
        const timeUntil = getTimeUntil(dayjs(), nextFrameClaim);
        const embed = new MessageEmbed(
          `Patron Reward`,
          msg.author
        ).setDescription(
          `You can claim your monthly reward again in **${timeUntil}**.`
        );

        await this.send(msg.channel, embed);
        return;
      } else {
        const frameVoucherItem = ItemService.getItemByName(
          `Patron Frame Voucher`
        );
        if (!frameVoucherItem) throw new ZephyrError.InvalidItemError();

        await ProfileService.addItems(profile, [
          { item: frameVoucherItem, count: 1 },
        ]);
        await PatreonService.setNextPatreonClaimTime(profile);

        const embed = new MessageEmbed(
          `Patron Reward`,
          msg.author
        ).setDescription(
          `You claimed **1x** \`${frameVoucherItem.names[0]}\`!`
        );

        await this.send(msg.channel, embed);
        return;
      }
    }
  }
}
