import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { getItemByName } from "../../assets/Items";

export default class DevUserCard extends BaseCommand {
  names = ["dgi"];
  description = `Gives someone an item.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const targetItem = getItemByName(options.slice(1).join(" "));
    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const targetProfile = await ProfileService.getProfile(targetUser.id);

    await ProfileService.addItems(targetProfile, [
      { item: targetItem, count: 1 },
    ]);

    const embed = new MessageEmbed(`Item Giver`, msg.author).setDescription(
      `Gave **1x** \`${targetItem.names[0]}\` to **${targetUser.tag}**`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
