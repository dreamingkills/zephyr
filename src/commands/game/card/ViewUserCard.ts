import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import {
  canBypass,
  generateUserTag,
  getTruncatedDescription,
} from "../../../lib/utility/text/TextUtils";
import { rgbToHex } from "../../../lib/utility/color/ColorUtils";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import dayjs from "dayjs";
import { dateTimeDisplay } from "../../../lib/utility/time/TimeUtils";

export default class ViewUserCard extends BaseCommand {
  id = `confusion`;
  names = [`card`, `show`, `view`, `v`];
  description = `Inspects one of your cards.`;
  usage = [`$CMD$ <card>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const attachPermission = checkPermission(`attachFiles`, msg.channel);

    if (!attachPermission && msg.channel.type !== 1)
      throw new ZephyrError.CannotAttachFilesError();

    const rawIdentifier = options[0];

    let card;

    if (!rawIdentifier) {
      card = await CardService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);

    if (card.discordId === Zephyr.user.id)
      throw new ZephyrError.CardBurnedError(card);

    if (
      card.vaulted &&
      card.discordId !== msg.author.id &&
      !canBypass(msg.author)
    )
      throw new ZephyrError.CardVaultedError(card);

    let targetProfile;
    if (card.discordId !== msg.author.id) {
      targetProfile = await ProfileService.getProfile(card.discordId);
    } else targetProfile = profile;

    const targetUser = await Zephyr.fetchUser(targetProfile.discordId);

    const baseCard = Zephyr.getCard(card.baseCardId)!;
    let image: Buffer;

    const stickers = await CardService.getCardStickers(card);

    if (
      card.frame.id === 1 &&
      card.dye.r === -1 &&
      card.dye.g === -1 &&
      card.dye.b === -1 &&
      targetProfile.patron < 2 &&
      stickers.length === 0
    ) {
      image = await CardService.getPrefabFromCache(baseCard);
    } else {
      image = await CardService.checkCacheForCard(card, profile.patron > 1);
    }

    const description = getTruncatedDescription(card);
    const level = CardService.getLevel(card);

    const claimRecord = await AnticheatService.getClaimInformation(card);

    const embed = new MessageEmbed(`View Card`, msg.author)
      .setDescription(
        `${description}\n\n` +
          `${
            level.level === 100 ? `:crown:` : `:chart_with_upwards_trend:`
          } **Level ${level.level}** - ${
            level.level === 100
              ? `**MAX!**`
              : `${card.experience.toLocaleString()}/${level.next.toLocaleString()} exp`
          }` +
          `\n:white_medium_small_square: Owned by **${generateUserTag(
            msg.author,
            targetUser,
            targetProfile
          )}**`
      )
      .setFooter(
        `${
          claimRecord
            ? `Claimed ${dateTimeDisplay(dayjs(claimRecord.claim_time))} • `
            : ``
        }Card #${card.serialNumber.toLocaleString()}`
      )
      .setImage(`attachment://card.png`);

    const [r, g, b] = [
      card.dye.r < 0 ? 185 : card.dye.r,
      card.dye.g < 0 ? 185 : card.dye.g,
      card.dye.b < 0 ? 185 : card.dye.b,
    ];

    embed.setColor(rgbToHex(r, g, b));

    // .setFooter(`Luck Coefficient: ${card.luckCoefficient}`);
    await this.send(msg.channel, embed, {
      files: [
        {
          file: image,
          name: "card.png",
        },
      ],
    });
  }
}
