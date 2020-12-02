import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class ViewUserCard extends BaseCommand {
  names = ["card", "show", "view"];
  description = "Inspects one of your cards.";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const reference = {
      identifier: this.options[0]?.split("#")[0]?.toUpperCase(),
      serialNumber: parseInt(this.options[0]?.split("#")[1], 10),
    };
    if (isNaN(reference.serialNumber))
      throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByReference(reference);
    const baseCard = this.zephyr.getCard(userCard.baseCardId);
    if (userCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(userCard);
    const image = await CardService.checkCacheForCard(userCard);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card View | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `\n—${baseCard.group ? ` **${baseCard.group}**` : ""} **${
          baseCard.name
        }** ${baseCard.subgroup ? ` (${baseCard.subgroup})` : ``} #${
          userCard.serialNumber
        }` +
          `\n— Tier **${userCard.tier}**` +
          `\n${baseCard.flavor ? `*${baseCard.flavor}*` : ``}`
      );
    await msg.channel.createMessage(
      { embed },
      {
        file: image,
        name: "card.png",
      }
    );
  }
}
