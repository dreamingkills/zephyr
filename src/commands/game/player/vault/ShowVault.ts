import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { isValidSnowflake } from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../structures/game/Profile";

export default class ShowVault extends BaseCommand {
  id = `shibuya`;
  names = [`vault`, `vlt`];
  description = `Shows you the contents of your vault.`;
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

    const embed = new MessageEmbed(`Vault`, msg.author)
      .setTitle(`${targetUser.tag}'s vault`)
      .setDescription(
        `🏦 **Welcome to the vault!**\nVaulted cards **will not** appear in your inventory!\nYou also won't be able to trade or burn them.\nSimilarly, vaulted currency **cannot** be spent.\n\n__You can add to your vault with \`${prefix}va\`, and remove with \`${prefix}vr\`.__`
      )
      .addFields([
        {
          name: `🧾 Currency`,
          value: `**${targetProfile.bitsVault.toLocaleString()}**/${targetProfile.bitsVaultMax.toLocaleString()} bits\n**${targetProfile.cubitsVault.toLocaleString()}**/${targetProfile.cubitsVaultMax.toLocaleString()} cubits`,
          inline: true,
        },
        {
          name: `🧾 Cards`,
          value: `**${vaultedCards.length}**/3 cards\n*view with \`${prefix}vc\`*!`,
          inline: true,
        },
      ]);

    await this.send(msg.channel, embed);
    return;
  }
}
