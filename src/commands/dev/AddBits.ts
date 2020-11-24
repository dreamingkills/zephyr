import { Message } from "eris";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class AddBits extends BaseCommand {
  names = ["addbits"];
  description = `Adds bits to a user's balance.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    if (!msg.mentions[0]) {
      await msg.channel.createMessage("YOU MUST MENTION A USER");
      return;
    }
    const amountRaw = msg.content.split(" ").filter((c) => !isNaN(parseInt(c)));
    if (!amountRaw[0]) {
      await msg.channel.createMessage("YOU MUST SPECIFY A VALID AMOUNT");
    }

    let targetUser = msg.mentions[0];
    let target = await ProfileService.getProfile(targetUser.id);
    const amount = parseInt(amountRaw[0]);

    const _target = await ProfileService.addBitsToProfile(target, amount);
    const embed = new MessageEmbed()
      .setAuthor(`Add Bits | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `Gave ${this.zephyr.config.discord.emoji.bits}**${amount}** to **${targetUser.tag}**.`
      )
      .setFooter(`New balance: ${_target.bits.toLocaleString()}`);

    await msg.channel.createMessage({ embed });
  }
}
