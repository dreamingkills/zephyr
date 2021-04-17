import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import {
  getDescriptions,
  isValidSnowflake,
} from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../structures/game/Profile";

export default class VaultCards extends BaseCommand {
  id = `peace`;
  names = [`vaultcards`, `vc`];
  description = `Shows you a list of cards in your vault.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const prefix = this.zephyr.getPrefix(msg.guildID);

    let targetProfile;
    let targetUser;

    if (
      options[0] &&
      (this.zephyr.config.developers.includes(msg.author.id) ||
        this.zephyr.config.moderators.includes(msg.author.id))
    ) {
      if (msg.mentions[0]) {
        targetUser = msg.mentions[0];
        targetProfile = await ProfileService.getProfile(targetUser.id);
      } else {
        const userId = options[0];

        if (!isValidSnowflake(userId))
          throw new ZephyrError.InvalidSnowflakeError();

        const fetchUser = await this.zephyr.fetchUser(userId);

        if (!fetchUser) throw new ZephyrError.UserNotFoundError();

        targetUser = fetchUser;
        targetProfile = await ProfileService.getProfile(fetchUser.id);
      }
    } else {
      targetUser = msg.author;
      targetProfile = profile;
    }

    const vaultedCards = await CardService.getVaultedCards(targetProfile);

    const cardTags = await ProfileService.getTags(profile);
    const descriptions = await getDescriptions(
      vaultedCards,
      this.zephyr,
      cardTags
    );

    const embed = new MessageEmbed(`Vault`, msg.author)
      .setTitle(`${targetUser.tag}'s vaulted cards`)
      .setDescription(
        descriptions.length === 0
          ? `**Your cards vault is empty!**\nUse \`${prefix}va cards <cards>\` to add some cards!`
          : `${descriptions.join(`\n`)}`
      );

    await this.send(msg.channel, embed);
    return;
  }
}
