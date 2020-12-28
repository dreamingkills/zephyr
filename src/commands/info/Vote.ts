import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Vote extends BaseCommand {
  names = ["vote", "cubits"];
  description = "Sends a link to Zephyr's voting page.";
  usage = ["$CMD$"];
  allowDm = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed()
      .setAuthor(`Vote | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(
        `You receive **2** cubits every time you vote.\nThis is doubled on weekends!\n— [Click here to vote!](https://top.gg/bot/791100707629432863)` +
          `\n\n**Cubits** can be spent on various cosmetic rewards for your cards.`
      );
    await msg.channel.createMessage({ embed });
  }
}
