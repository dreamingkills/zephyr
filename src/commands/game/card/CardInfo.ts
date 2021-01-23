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
  names = ["cardinfo", "ci"];
  description = "Shows you information a card.";
  usage = ["$CMD$ [card]"];

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

    const claimTime = dayjs(claimInfo.claim_time).format(`YYYY/MM/DD HH:mm:ss`);
    let claimer;
    let dropper;

    if (claimInfo.claimer) {
      const claimerUser = await this.zephyr.fetchUser(claimInfo.claimer);
      const claimerProfile = await ProfileService.getProfile(claimInfo.claimer);
      if (
        claimerProfile.private &&
        claimerProfile.discordId !== msg.author.id
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
          dropperProfile.discordId !== msg.author.id
        ) {
          dropper = "Private User";
        } else dropper = dropperUser.tag;
      }
    } else dropper = "Server Activity";

    const cardImage = await CardService.checkCacheForCard(card, this.zephyr);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card Info | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Showing stats for \`${card.id.toString(36)}\`...` +
          `\n\n— Claimed at **${claimTime} UTC**` +
          `\n— Claimed in **${claimInfo.guild_id}**` +
          `\n— Dropped by **${dropper}**` +
          `\n— Claimed by **${claimer}**` +
          `\n\n— Claimed in **${
            ["damaged", "poor", "average", "good", "great", "mint"][
              card.originalWear
            ]
          }** condition` +
          `\n— Claimed in **${((card.claimTime - 5000) / 1000).toFixed(2)}s**`
      )
      .setThumbnail(`attachment://card.png`);

    await this.send(msg.channel, embed, {
      file: { file: cardImage, name: "card.png" },
    });
    return;
  }
}
