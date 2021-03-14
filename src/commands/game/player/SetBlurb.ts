import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class SetBlurb extends BaseCommand {
  id = `genesis`;
  names = ["blurb", "setblurb", "desc", "setdesc"];
  description = "Changes the blurb on your profile.";
  usage = ["$CMD$ <up to 500 characters>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const originalLength = options.join(` `).length;
    const blurb = options.join(" ").slice(0, 500);
    await ProfileService.setProfileBlurb(profile, blurb);

    const embed = new MessageEmbed(`Blurb`, msg.author).setDescription(
      (originalLength > 500
        ? `:warning: Your blurb has been shortened to 500 characters.\n`
        : ``) +
        `Updated your blurb to:` +
        `\n\`\`\`` +
        `\n${blurb || "empty blurb"}` +
        `\n\`\`\``
    );

    await this.send(msg.channel, embed);
    return;
  }
}
