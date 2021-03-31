import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { getDescriptions } from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";

export default class VaultCards extends BaseCommand {
  id = `peace`;
  names = [`vaultcards`, `vc`];
  description = `Shows you a list of cards in your vault.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const prefix = this.zephyr.getPrefix(msg.guildID);
    const vaultedCards = await CardService.getVaultedCards(profile);

    const cardTags = await ProfileService.getTags(profile);
    const descriptions = await getDescriptions(
      vaultedCards,
      this.zephyr,
      cardTags
    );

    const embed = new MessageEmbed(`Vault`, msg.author)
      .setTitle(`${msg.author.tag}'s vaulted cards`)
      .setDescription(
        descriptions.length === 0
          ? `**Your  cards vault is empty!**\nUse \`${prefix}va cards <cards>\` to add some cards!`
          : `${descriptions.join(`\n`)}`
      );

    await this.send(msg.channel, embed);
    return;
  }
}
