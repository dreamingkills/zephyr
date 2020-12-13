import { Message } from "eris";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class AddBits extends BaseCommand {
  names = ["adddust"];
  description = `Adds dust to a user's balance.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    let targetUser = msg.mentions[0];
    let target = await ProfileService.getProfile(targetUser.id);
    const tier = parseInt(this.options[0]);
    if (isNaN(tier) || tier < 1 || tier > 5)
      throw new ZephyrError.InvalidDustTypeError();
    const amount = parseInt(this.options[1], 10);
    if (isNaN(amount) || amount < 1)
      throw new ZephyrError.InvalidAmountError("dust");

    await ProfileService.addDustToProfile(
      tier as 1 | 2 | 3 | 4 | 5,
      amount,
      target
    );
    const embed = new MessageEmbed()
      .setAuthor(`Add Dust | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `Gave **${amount.toLocaleString()}x** Card Dust \`${"★"
          .repeat(tier)
          .padEnd(5, "☆")}\` to **${targetUser.tag}**.`
      );

    await msg.channel.createMessage({ embed });
  }
}
