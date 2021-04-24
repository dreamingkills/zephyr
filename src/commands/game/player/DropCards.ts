import { Message, TextChannel } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardSpawner } from "../../../lib/CardSpawner";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import dayjs from "dayjs";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { GuildService } from "../../../lib/database/services/guild/GuildService";
import { checkPermission, isDeveloper } from "../../../lib/ZephyrUtils";
import { StatsD } from "../../../lib/StatsD";
import { Zephyr } from "../../../structures/client/Zephyr";
// import childProcess from "child_process";

export default class DropCards extends BaseCommand {
  id = `stylo`;
  names = [`drop`];
  description = `Drops three random cards in the channel.`;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const timeStart = Date.now();

    if (!Zephyr.flags.drops && !isDeveloper(msg.author))
      throw new ZephyrError.DropFlagDisabledError();

    const reactPermission = checkPermission(`addReactions`, msg.channel);

    if (!reactPermission) throw new ZephyrError.CannotReactError();

    const attachPermission = checkPermission(`attachFiles`, msg.channel);

    if (!attachPermission) throw new ZephyrError.CannotAttachFilesError();

    const dropChannel = await GuildService.getDropChannel(msg.guildID!);

    if (!dropChannel && !Zephyr.config.developers.includes(msg.author.id)) {
      const prefix = Zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.UnsetZephyrChannelError(prefix);
    }

    if (
      msg.channel.id !== dropChannel &&
      !Zephyr.config.discord.secondaryChannels.includes(msg.channel.id) &&
      !Zephyr.config.developers.includes(msg.author.id)
    )
      throw new ZephyrError.CannotDropInChannelError(dropChannel!);

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

    const restricted = dayjs(msg.author.createdAt) > dayjs().subtract(7, `day`);

    const cards = Zephyr.getRandomCards(3, wishlist, boost, restricted);

    await ProfileService.setDropTimestamp(
      profile,
      dayjs(new Date()).add(30, "minute").format(`YYYY/MM/DD HH:mm:ss`)
    );

    await CardSpawner.userDrop(<TextChannel>msg.channel, cards, profile);

    const timeEnd = Date.now();

    StatsD.gauge(`zephyr.command.drop`, timeEnd - timeStart);

    return;
  }

  /*private runScript(scriptPath: string, callback: any) {
    let invoked = false;
    let process = childProcess.fork(scriptPath);

    process.on("error", function (err) {
      if (invoked) return;
      invoked = true;
      callback(err);
    });

    process.on("exit", function (code) {
      if (invoked) return;
      invoked = true;
      var err = code === 0 ? null : new Error(" exit code: " + code);
      callback(err);
    });
  }*/
}
