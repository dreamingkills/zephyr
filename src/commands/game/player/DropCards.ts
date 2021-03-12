import { Message, TextChannel } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardSpawner } from "../../../lib/CardSpawner";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import dayjs from "dayjs";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { GuildService } from "../../../lib/database/services/guild/GuildService";
import { checkPermission } from "../../../lib/ZephyrUtils";

export default class DropCards extends BaseCommand {
  names = ["drop"];
  description = "Drops three random cards in the channel.";
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (!this.zephyr.flags.drops) throw new ZephyrError.DropFlagDisabledError();

    const reactPermission = checkPermission(
      `addReactions`,
      msg.channel,
      this.zephyr
    );
    if (!reactPermission) throw new ZephyrError.CannotReactError();

    const dropChannel = await GuildService.getDropChannel(msg.guildID!);

    if (!dropChannel) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.UnsetZephyrChannelError(prefix);
    }

    if (
      msg.channel.id !== dropChannel &&
      !this.zephyr.config.discord.secondaryChannels.includes(msg.channel.id)
    )
      throw new ZephyrError.CannotDropInChannelError(dropChannel);
    const now = dayjs(Date.now());
    const until = dayjs(profile.dropNext);
    if (now < until)
      throw new ZephyrError.DropCooldownError(getTimeUntil(now, until));

    const wishlist = await ProfileService.getWishlist(profile);
    let boost;

    if (profile.boosterGroup) {
      const expiry = dayjs(profile.boosterExpiry);
      const now = dayjs();
      if (now > expiry) {
        await ProfileService.clearBooster(profile);
      } else {
        boost = profile.boosterGroup;
      }
    }
    const cards = this.zephyr.getRandomCards(3, wishlist, boost);

    await ProfileService.setDropTimestamp(
      profile,
      dayjs(new Date()).add(30, "minute").format(`YYYY/MM/DD HH:mm:ss`)
    );

    await CardSpawner.userDrop(
      <TextChannel>msg.channel,
      cards,
      profile,
      this.zephyr
    );
    return;
  }
}
