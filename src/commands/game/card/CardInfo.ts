import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import dayjs from "dayjs";

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

    const claimInfo = await AnticheatService.getClaimInformation(card);

    if (!claimInfo) {
      const embed = new MessageEmbed(`Card Info`, msg.author).setDescription(
        `:thinking: This card has no history... perhaps it will have a future.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const claimTime = dayjs(claimInfo.claim_time).format(`YYYY/MM/DD HH:mm:ss`);
    let claimer;
    let dropper;

    if (claimInfo.claimer) {
      const claimerUser = await this.zephyr.fetchUser(claimInfo.claimer);
      const claimerProfile = await ProfileService.getProfile(claimInfo.claimer);
      if (
        claimerProfile.private &&
        claimerProfile.discordId !== msg.author.id &&
        !this.zephyr.config.moderators.includes(msg.author.id)
      ) {
        claimer = "Private User";
      } else claimer = claimerUser?.tag || "Unknown User";
    }

    if (claimInfo.dropper) {
      const dropperUser = await this.zephyr.fetchUser(claimInfo.dropper);
      if (!dropperUser) {
        dropper = "Unknown User";
      } else {
        const dropperProfile = await ProfileService.getProfile(dropperUser.id);
        if (
          dropperProfile.private &&
          dropperProfile.discordId !== msg.author.id &&
          !this.zephyr.config.moderators.includes(msg.author.id)
        ) {
          dropper = "Private User";
        } else dropper = dropperUser.tag;
      }
    } else dropper = "Server Activity";

    const cardImage = await CardService.checkCacheForCard(card, this.zephyr);

    const embed = new MessageEmbed(`Card Info`, msg.author)
      .setDescription(
        `Showing stats for \`${card.id.toString(36)}\`...` +
          `\n\n— Claimed at **${claimTime} UTC**` +
          `\n— Claimed in **${claimInfo.guild_id}**` +
          `\n— Dropped by **${dropper}**` +
          `\n— Claimed by **${claimer}**` +
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
