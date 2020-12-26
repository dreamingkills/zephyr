import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ViewUserCard extends BaseCommand {
  names = ["card", "show", "view", "v"];
  description = "Inspects one of your cards.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const rawIdentifier = this.options[0];
    let card;
    if (!rawIdentifier) {
      card = await ProfileService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);

    const baseCard = this.zephyr.getCard(card.baseCardId);
    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);
    const image = await CardService.checkCacheForCard(card, this.zephyr);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card View - ${card.id.toString(36)} | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `—${baseCard.group ? ` **${baseCard.group}**` : ""} **${
          baseCard.name
        }** ${baseCard.subgroup ? ` (${baseCard.subgroup})` : ``} #${
          card.serialNumber
        }` +
          `\n— Frame: **${card.frameName || "Default"}**` +
          `\n— Condition: **${
            ["Damaged", "Poor", "Average", "Good", "Great", "Mint"][card.wear]
          }**` +
          `\n${baseCard.flavor ? `*${baseCard.flavor}*` : ``}`
      );
    // .setFooter(`Luck Coefficient: ${card.luckCoefficient}`);
    await msg.channel.createMessage(
      { embed },
      {
        file: image,
        name: "card.png",
      }
    );
  }
}
