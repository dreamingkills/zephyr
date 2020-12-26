import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class CardSearch extends BaseCommand {
  names = ["cardsearch", "cs"];
  description = "Shows you information about a card.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const rawIdentifier = this.options[0];
    let card;
    if (!rawIdentifier) {
      card = await ProfileService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);

    const baseCard = this.zephyr.getCard(card.baseCardId);

    const owner = await this.zephyr.fetchUser(card.discordId);
    let ownerProfile: GameProfile | undefined;
    try {
      ownerProfile = await ProfileService.getProfile(card.discordId);
    } catch {} // undefined if burned

    const originalOwner = await this.zephyr.fetchUser(card.originalOwner);
    const originalProfile = await ProfileService.getProfile(card.originalOwner);

    const embed = new MessageEmbed().setAuthor(
      `Card Search | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    if (!ownerProfile) {
      embed.setDescription(`:fire: __**This card has been burned!**__ :fire:`);
    } else if (ownerProfile.blacklisted) {
      embed.setDescription(
        `:hammer: __**This card is owned by a blacklisted user.**__`
      );
    } else if (ownerProfile.private) {
      embed.setDescription(`:bust_in_silhouette: Owned by *Private User*`);
    } else if (owner) {
      embed.setDescription(`:bust_in_silhouette: Owned by **${owner.tag}**`);
    } else {
      embed.setDescription(`:bust_in_silhouette: Owned by *Unknown User*`);
    }

    embed
      .setDescription(
        `\n— **${baseCard.group ? `${baseCard.group} ` : ``}${
          baseCard.name
        }** ${baseCard.subgroup ? `(${baseCard.subgroup})` : ``}` +
          `\n— Issue **#${card.serialNumber}**` +
          `\n— Condition: **${
            ["Damaged", "Poor", "Average", "Good", "Great", "Mint"][card.wear]
          }**` +
          `${
            card.frameId !== null && card.frameId !== 1
              ? `\n— Frame: **${card.frameName}**`
              : ``
          }`
      )
      .setFooter(
        card.originalOwner !== card.discordId
          ? `Card originally owned by ${
              originalProfile.private && originalOwner?.id !== msg.author.id
                ? `Private User`
                : originalOwner
                ? `${originalOwner.tag}`
                : `*Unknown User*`
            }`
          : ``
      );
    await msg.channel.createMessage({ embed });
  }
}
