import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class ToggleBlacklist extends BaseCommand {
  names = ["toggledrops"];
  description = `Toggles drops being enabled/disabled.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    this.zephyr.dropsEnabled = !this.zephyr.dropsEnabled;
    const embed = new MessageEmbed()
      .setAuthor(
        `Toggle Drops | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Drops have been ${this.zephyr.dropsEnabled ? `enabled` : `disabled`}.`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
