import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { rgbToHex } from "../../../lib/utility/color/ColorUtils";
import { createCanvas } from "canvas";

export default class ViewDye extends BaseCommand {
  id = `faith`;
  names = ["viewdye", "vd"];
  description = "Shows you a dye you own.";
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!this.zephyr.flags.dyes) throw new ZephyrError.DyeFlagDisabledError();

    if (!options[0] || !options[0].startsWith("$"))
      throw new ZephyrError.InvalidDyeIdentifierError();

    const dyeId = options[0]?.toLowerCase();
    const dyeTarget = await ProfileService.getDyeByIdentifier(dyeId);

    const dyeOwner = await this.zephyr.fetchUser(dyeTarget.discordId);
    const dyeOwnerProfile = await ProfileService.getProfile(
      dyeOwner?.id || dyeTarget.discordId
    );

    const dyeHex = rgbToHex(dyeTarget.dyeR, dyeTarget.dyeG, dyeTarget.dyeB);

    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = dyeHex;
    ctx.fillRect(0, 0, 100, 100);

    const buffer = canvas.toBuffer("image/jpeg");
    const buf = Buffer.alloc(buffer.length, buffer, "base64");

    const embed = new MessageEmbed(`View Dye`, msg.author)
      .setDescription(
        `Viewing dye \`$${dyeTarget.id.toString(36)}\` **${
          dyeTarget.name
        }**...` +
          `\n— Owned by ${
            dyeOwnerProfile.private &&
            dyeOwnerProfile.discordId !== msg.author.id
              ? `*Private User*`
              : dyeOwner
              ? `**${dyeOwner.tag}**`
              : `*Unknown User*`
          }` +
          `\n— Charges: \`${dyeTarget.charges.toLocaleString()}\`` +
          `\n— Hex: **${dyeHex.toUpperCase()}**`
      )
      .setThumbnail(`attachment://dyepreview.png`)
      .setColor(dyeHex);

    await this.send(msg.channel, embed, {
      file: { file: buf, name: `dyepreview.png` },
    });
    return;
  }
}
