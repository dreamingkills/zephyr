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
  getDescriptions,
} from "../../../lib/utility/text/TextUtils";
import { rgbToHex } from "../../../lib/utility/color/ColorUtils";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

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
    if (
      msg.channel.id === Zephyr.config.discord.main &&
      !Zephyr.flags.mainViewing
    )
      throw new ZephyrError.MainViewingFlagDisabledError();

    const attachPermission = checkPermission(`attachFiles`, msg.channel);

    if (!attachPermission && msg.channel.type !== 1)
      throw new ZephyrError.CannotAttachFilesError();

    const rawIdentifier = options[0];
    // let noText = options[1]?.toLowerCase().replace(`—`, `--`) === "--notext";

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

    if (
      card.frame.id === 1 &&
      card.dye.r === -1 &&
      card.dye.g === -1 &&
      card.dye.b === -1 &&
      targetProfile.patron < 2
    ) {
      image = await CardService.getPrefabFromCache(baseCard);
    } else {
      image = await CardService.checkCacheForCard(card, profile.patron > 1);
    }

    const userTags = await ProfileService.getTags(targetProfile);
    const cardDescription = (await getDescriptions([card], userTags))[0];

    const embed = new MessageEmbed(`View Card`, msg.author)
      .setDescription(
        `${cardDescription} ${
          baseCard.subgroup ? `**(${baseCard.subgroup})**` : ``
        }\n` +
          `\nOwner: **${generateUserTag(
            msg.author,
            targetUser,
            targetProfile
          )}**`
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
