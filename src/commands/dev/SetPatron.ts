import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { PatreonService } from "../../lib/database/services/meta/PatreonService";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class SetPatron extends BaseCommand {
  names = ["setpatron"];
  description = `Marks someone as a Patron.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const tier = parseInt(this.options[1], 10);
    if (isNaN(tier)) throw new ZephyrError.InvalidAmountError("tier");

    const target = await ProfileService.getProfile(targetUser.id);

    if (tier === 0) {
      await ProfileService.setPatronTier(target, 0);
      await PatreonService.removePatron(target);

      const embed = new MessageEmbed()
        .setAuthor(
          `Set Patron | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(`Unmarked **${targetUser.tag}** as patron.`);

      await msg.channel.createMessage({ embed });
      return;
    } else {
      await ProfileService.setPatronTier(target, tier);
      await PatreonService.addPatron(target);

      const embed = new MessageEmbed()
        .setAuthor(
          `Set Patron | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `Marked **${targetUser.tag}** as a Tier **${tier}** patron.`
        );

      await msg.channel.createMessage({ embed });
      return;
    }
  }
}
