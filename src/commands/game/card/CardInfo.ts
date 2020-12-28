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

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const reference = this.options[0];
    let card: GameUserCard;
    if (!reference) {
      const lastCard = await ProfileService.getLastCard(profile);
      card = lastCard;
    } else {
      card = await CardService.getUserCardByIdentifier(reference);
    }

    const claimInfo = await AnticheatService.getClaimInformation(card);

    const claimTime = dayjs(claimInfo.claim_time).format(`YYYY/MM/DD HH:mm:ss`);
    const claimGuild = await this.zephyr.fetchGuild(claimInfo.guild_id);
    const dropperUser = await this.zephyr.fetchUser(claimInfo.dropper);
    const claimerUser = await this.zephyr.fetchUser(claimInfo.claimer);

    const cardImage = await CardService.checkCacheForCard(card, this.zephyr);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card Info | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Showing stats for \`${card.id.toString(36)}\`...` +
          `\n\n— Claimed at **${claimTime} UTC**` +
          `\n— Claimed in **${
            claimGuild
              ? claimGuild.name
              : `Unknown Guild (${claimInfo.guild_id})`
          }**` +
          `\n— Dropped by **${
            dropperUser ? dropperUser.tag : `Unknown User`
          }**` +
          `\n— Claimed by **${
            claimerUser ? claimerUser.tag : `Unknown User`
          }**` +
          `\n\n— Claimed in **${
            ["damaged", "poor", "average", "good", "great", "mint"][
              card.originalWear
            ]
          }** condition` +
          `\n— Claimed in **${((card.claimTime - 5000) / 1000).toFixed(2)}s**`
      )
      .setThumbnail(`attachment://card.png`);

    await msg.channel.createMessage(
      { embed },
      { file: cardImage, name: "card.png" }
    );
  }
}
