import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { calculateTalent } from "../../../lib/talent";
import { getDescriptions } from "../../../lib/ZephyrUtils";

export default class ViewUserCard extends BaseCommand {
  names = ["card", "show", "view", "v"];
  description = "Inspects one of your cards.";
  usage = ["$CMD$ <card>"];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const rawIdentifier = this.options[0];
    let card;
    if (!rawIdentifier) {
      card = await ProfileService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);

    if (card.discordId === this.zephyr.user.id)
      throw new ZephyrError.CardBurnedError(card);

    let targetProfile;
    if (card.discordId !== msg.author.id) {
      targetProfile = await ProfileService.getProfile(card.discordId);
    } else targetProfile = profile;

    if (targetProfile.private && targetProfile.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError();

    const targetUser = await this.zephyr.fetchUser(targetProfile.discordId);

    const baseCard = this.zephyr.getCard(card.baseCardId);
    const image = await CardService.checkCacheForCard(card, this.zephyr);

    const cardTalent = calculateTalent(targetProfile, card, baseCard);
    const userTags = await ProfileService.getTags(targetProfile);
    const cardDescription = getDescriptions([card], this.zephyr, userTags)[0];

    const embed = new MessageEmbed()
      .setAuthor(
        `Card View | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `${cardDescription}\n` +
          `\nOwner: ${
            targetUser ? `**${targetUser.tag}**` : `*Unknown User*`
          }` +
          `\nTalent: **${cardTalent.total}**`
      )
      .setImage(`attachment://card.png`);
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
