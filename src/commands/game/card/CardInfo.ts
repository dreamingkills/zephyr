import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import dayjs from "dayjs";
import {
  canBypass,
  generateUserTag,
} from "../../../lib/utility/text/TextUtils";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class CardInfo extends BaseCommand {
  id = `sickman`;
  names = [`cardinfo`, `ci`];
  description = `Shows you a card's statistics.`;
  usage = [`$CMD$ [card]`];

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const reference = options[0];
    let card: GameUserCard;
    if (!reference) {
      const lastCard = await CardService.getLastCard(profile);
      card = lastCard;
    } else {
      card = await CardService.getUserCardByIdentifier(reference);
    }

    if (
      card.vaulted &&
      card.discordId !== msg.author.id &&
      !canBypass(msg.author)
    )
      throw new ZephyrError.CardVaultedError(card);

    const claimInfo = await AnticheatService.getClaimInformation(card);

    if (!claimInfo) {
      const embed = new MessageEmbed(`Card Info`, msg.author).setDescription(
        `:thinking: This card has no history... perhaps it will have a future.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const claimTime = dayjs(claimInfo.claim_time).format(`YYYY/MM/DD HH:mm:ss`);

    let claimerTag;
    let dropperTag;

    if (claimInfo.claimer) {
      const claimerUser = await Zephyr.fetchUser(claimInfo.claimer);

      if (claimerUser) {
        const claimerProfile = await ProfileService.getProfile(
          claimInfo.claimer
        );

        claimerTag = generateUserTag(msg.author, claimerUser, claimerProfile);
      } else claimerTag = `Unknown User`;
    } else claimerTag = `Unknown User`;

    if (claimInfo.dropper) {
      const dropperUser = await Zephyr.fetchUser(claimInfo.dropper);

      if (dropperUser) {
        const dropperProfile = await ProfileService.getProfile(dropperUser.id);

        dropperTag = generateUserTag(msg.author, dropperUser, dropperProfile);
      } else dropperTag = `Unknown User`;
    } else dropperTag = "Server Activity";

    const cardImage = await CardService.checkCacheForCard(card);

    const embed = new MessageEmbed(`Card Info`, msg.author)
      .setDescription(
        `Showing stats for \`${card.id.toString(36)}\`...` +
          `\n\n— Claimed at **${claimTime} UTC**` +
          `\n— Claimed in **${claimInfo.guild_id}**` +
          `\n— Dropped by **${dropperTag}**` +
          `\n— Claimed by **${claimerTag}**` +
          `\n\n— Claimed in **${
            ["damaged", "poor", "average", "good", "great", "mint"][
              claimInfo.wear
            ]
          }** condition` +
          `\n— Claimed in **${(claimInfo.claimed_after / 1000).toFixed(2)}s**`
      )
      .setThumbnail(`attachment://card.png`);

    await this.send(msg.channel, embed, {
      files: [{ file: cardImage, name: "card.png" }],
    });
    return;
  }
}
