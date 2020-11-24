import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class TogglePrivate extends BaseCommand {
  names = ["blurb", "setblurb", "desc", "setdesc"];
  description = "Changes the blurb on your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const blurbRaw = this.options.join(" ");
    const blurb = this.options.join(" ").slice(0, 500);
    await ProfileService.setProfileBlurb(profile, blurb);

    const embed = new MessageEmbed()
      .setAuthor(
        `Blurb | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        (blurbRaw.length > 500
          ? `:warning: Your blurb has been shortened to 500 characters.\n`
          : ``) +
          `Updated your blurb to:` +
          `\n\`\`\`` +
          `\n${blurb || "empty blurb"}` +
          `\n\`\`\``
      );
    await msg.channel.createMessage({ embed });
  }
}
