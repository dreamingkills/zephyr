import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class Ping extends BaseCommand {
  names = ["profile", "p"];
  description = "Displays your profile.";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed().setAuthor(
      `Profile | ${msg.author.tag}`,
      msg.author.avatarURL
    );
    await msg.channel.createMessage({ embed });
  }
}
