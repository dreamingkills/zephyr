import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { items } from "../../assets/items.json";
import { ProfileService } from "../../lib/database/services/game/ProfileService";

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

    const targetItem = items.filter(
      (i) => i.name.toLowerCase() === options.slice(1).join(" ").toLowerCase()
    )[0];
    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const targetProfile = await ProfileService.getProfile(targetUser.id);

    await ProfileService.addItems(targetProfile, [
      { item: targetItem, count: 1 },
    ]);

    const embed = new MessageEmbed()
      .setAuthor(
        `Item Giver | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Gave **1x** \`${targetItem.name}\` to **${targetUser.tag}**`
      );

    await this.send(msg.channel, embed);
    return;
  }
}
