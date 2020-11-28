import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class TogglePrivate extends BaseCommand {
  names = ["private", "priv", "public", "pub"];
  description = "Toggles your account between private and public.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const newProfile = await ProfileService.togglePrivateProfile(profile);
    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `Your profile is now ${newProfile.private ? `private` : `public`}.`
      );
    await msg.channel.createMessage({ embed });
  }
}
