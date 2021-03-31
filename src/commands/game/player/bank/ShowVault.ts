import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";

export default class ShowVault extends BaseCommand {
  id = `shibuya`;
  names = [`vault`, `vlt`];
  description = `Shows you the contents of your vault.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const prefix = this.zephyr.getPrefix(msg.guildID);
    const vaultedCards = await CardService.getVaultedCards(profile);

    const embed = new MessageEmbed(`Vault`, msg.author)
      .setTitle(`${msg.author.tag}'s vault`)
      .setDescription(
        `🏦 **Welcome to your vault!**\nVaulted cards **will not** appear in your inventory!\nYou also won't be able to trade or burn them.\nSimilarly, vaulted currency **cannot** be spent.`
      )
      .addFields([
        {
          name: `🧾 Currency`,
          value: `**${profile.bitsVault.toLocaleString()}**/${profile.bitsVaultMax.toLocaleString()} bits\n**${profile.cubitsVault.toLocaleString()}**/${profile.cubitsVaultMax.toLocaleString()} cubits`,
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
