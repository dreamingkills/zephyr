import { Message } from "eris";
import { CardService } from "../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class DevUserCard extends BaseCommand {
  names = ["devusercard", "duc"];
  description = `Views debug information about a given user card.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const identifier = this.options[0];
    if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByIdentifier(identifier);
    const baseCard = this.zephyr.getCard(userCard.baseCardId);

    const embed = new MessageEmbed()
      .setAuthor(
        `Dev User Card | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `**Base Card ID**: ${baseCard.id}` +
          `\n**User Card ID**: ${userCard.id}` +
          `\n**Owner ID**: ${userCard.discordId}` +
          `\n**Serial Number**: ${userCard.serialNumber}` +
          `\n**Condition**: ${userCard.wear}`
      );
    await msg.channel.createMessage({ embed });
    return;
  }
}
