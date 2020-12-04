import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class CardSearch extends BaseCommand {
  names = ["cardsearch", "cs"];
  description = "Shows you information about a card.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const reference = {
      identifier: this.options[0]?.split("#")[0]?.toUpperCase(),
      serialNumber: parseInt(this.options[0]?.split("#")[1], 10),
    };
    if (isNaN(reference.serialNumber))
      throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByReference(reference);
    const baseCard = this.zephyr.getCard(userCard.baseCardId);

    const owner = await this.zephyr.fetchUser(userCard.discordId);
    const originalOwner = await this.zephyr.fetchUser(userCard.originalOwner);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card Search | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `:bust_in_silhouette: Owned by **${owner.tag}**` +
          `\n— **${baseCard.group ? `${baseCard.group} ` : ``}${
            baseCard.name
          }** ${baseCard.subgroup ? `(${baseCard.subgroup})` : ``}` +
          `\n— Issue **#${userCard.serialNumber}**` +
          `${
            userCard.frameId !== 1 ? `\n— Frame: **${userCard.frameName}**` : ``
          }`
      )
      .setFooter(`Card originally owned by ${originalOwner.tag}`);
    await msg.channel.createMessage({ embed });
  }
}
