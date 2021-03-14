import { Message, User } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import dayjs from "dayjs";

export default class UserInfo extends BaseCommand {
  id = `ashes`;
  names = ["userinfo", "ui"];
  description = "Shows you information about a user.";
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let targetUser: User | undefined;
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (options[0]) {
      const userId = options[0];
      if (isNaN(parseInt(userId)) || options[0].length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(userId);
    } else targetUser = msg.author;

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    const target = await ProfileService.getProfile(targetUser.id);

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const timesVoted = await AnticheatService.getNumberOfVotes(target);
    const timesClaimed = await AnticheatService.getNumberOfClaimedCards(target);
    const timesGifted = await AnticheatService.getNumberOfCardsGifted(target);
    const timesReceivedGift = await AnticheatService.getNumberOfCardsReceivedByGift(
      target
    );
    const timesCardBurned = await AnticheatService.getNumberOfCardsBurned(
      target
    );

    const createdAt = dayjs(target.createdAt).format(`MMMM D, YYYY`);

    const embed = new MessageEmbed(`User Info`, msg.author)
      .setDescription(
        `Showing stats for **${targetUser.tag}**...` +
          `\n— Times voted: **${timesVoted.toLocaleString()}**` +
          `\n— Cards claimed: **${timesClaimed}**` +
          `\n— Cards burned: **${timesCardBurned}**` +
          `\n— Cards gifted: **${timesGifted}**` +
          `\n— Gifts received: **${timesReceivedGift}**` +
          `\n\nAccount created **${createdAt}**`
      )
      .setThumbnail(targetUser.dynamicAvatarURL("png"));

    await this.send(msg.channel, embed);
    return;
  }
}
