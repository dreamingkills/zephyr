import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { renderIdentifier } from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { VaultError } from "../../../../structures/error/VaultError";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../structures/game/Profile";

export default class VaultRemove extends BaseCommand {
  id = `petal`;
  names = [`vaultremove`, `vr`];
  description = `Allows you to remove cards or currency from your vault.`;
  usage = [`$CMD$ <bits/cubits> <number>`, `$CMD$ cards <cards>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!this.zephyr.flags.transactions)
      throw new ZephyrError.TransactionFlagDisabledError();

    const type = options[0]?.toLowerCase();
    const prefix = this.zephyr.getPrefix(msg.guildID);

    if (!type) throw new VaultError.InvalidVaultTypeError(prefix);

    if (![`bits`, `cubits`, `cards`].includes(type))
      throw new VaultError.InvalidVaultTypeError(prefix);

    if (type === `bits`) {
      const quantity = parseInt(options[1]);

      if (isNaN(quantity) || quantity < 1 || quantity < 1)
        throw new VaultError.InvalidVaultBitsQuantityError(prefix);

      if (profile.bitsVault < quantity)
        throw new VaultError.NotEnoughBitsInVaultError(prefix);

      const _profile = await ProfileService.removeBitsFromVault(
        profile,
        quantity,
        prefix
      );

      const embed = new MessageEmbed(`Vault`, msg.author)
        .setDescription(
          `✅ **Withdrew __${quantity.toLocaleString()}__ bits from your vault!**\n${
            _profile.bitsVault === 0
              ? `Your bits vault is now **empty**!`
              : `You now have **${_profile.bitsVault.toLocaleString()}** bits in your vault.`
          }`
        )
        .setFooter(`💸 New balance: ${_profile.bits.toLocaleString()}`);

      await this.send(msg.channel, embed);

      return;
    } else if (type === `cubits`) {
      const quantity = parseInt(options[1]);

      if (isNaN(quantity) || quantity < 1)
        throw new VaultError.InvalidVaultCubitsQuantityError(prefix);

      if (profile.cubitsVault < quantity)
        throw new VaultError.NotEnoughCubitsInVaultError(prefix);

      const _profile = await ProfileService.removeCubitsFromVault(
        profile,
        quantity,
        prefix
      );

      const embed = new MessageEmbed(`Vault`, msg.author)
        .setDescription(
          `✅ **Withdrew __${quantity.toLocaleString()}__ cubits from your vault!**\n${
            _profile.cubitsVault === 0
              ? `Your cubits vault is now **empty**!`
              : `You now have **${_profile.cubitsVault.toLocaleString()}** cubits in your vault.`
          }`
        )
        .setFooter(`💸 New balance: ${_profile.cubits.toLocaleString()}`);

      await this.send(msg.channel, embed);

      return;
    } else if (type === `cards`) {
      const cardsInVault = await CardService.getVaultedCards(profile);

      const cardIdentifiers = options.slice(1);

      if (cardIdentifiers.length === 0)
        throw new VaultError.InvalidVaultCardIdentifierError(prefix);

      const cards = [];

      for (let id of cardIdentifiers) {
        const card = await CardService.getUserCardByIdentifier(id);

        if (card.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);

        if (!cardsInVault.find((c) => c.id === card.id))
          throw new VaultError.CardNotInVaultError(prefix, card);

        cards.push(card);
      }

      await CardService.unsetCardsVaulted(cards);

      const embed = new MessageEmbed(`Vault`, msg.author).setDescription(
        `✅ **Removed** \`${cards
          .map((c) => renderIdentifier(c))
          .join(`\`, \``)}\` **from your vault**!`
      );

      await this.send(msg.channel, embed);

      return;
    }
  }
}
