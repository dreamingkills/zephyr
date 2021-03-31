import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { renderIdentifier } from "../../../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { VaultError } from "../../../../structures/error/VaultError";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../structures/game/Profile";

export default class VaultAdd extends BaseCommand {
  id = `ares`;
  names = [`vaultadd`, `va`];
  description = `Allows you to add currency or cards to your vault.`;
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

      if (isNaN(quantity) || quantity < 1)
        throw new VaultError.InvalidVaultBitsQuantityError(prefix);

      if (profile.bits < quantity)
        throw new ZephyrError.NotEnoughBitsError(quantity);

      const trueQuantity =
        quantity + profile.bitsVault > profile.bitsVaultMax
          ? profile.bitsVaultMax - profile.bitsVault
          : quantity;

      if (trueQuantity === 0) throw new VaultError.BitsVaultFullError(prefix);

      const _profile = await ProfileService.addBitsToVault(
        profile,
        trueQuantity
      );

      const embed = new MessageEmbed(`Vault`, msg.author)
        .setDescription(
          `✅ **Added __${trueQuantity}__ bits to your vault!**\n${
            _profile.bitsVault === _profile.bitsVaultMax
              ? `Your bits vault is now **full**!`
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

      if (profile.cubits < quantity)
        throw new ZephyrError.NotEnoughCubitsError(profile.cubits, quantity);

      const trueQuantity =
        quantity + profile.cubitsVault > profile.cubitsVaultMax
          ? profile.cubitsVaultMax - profile.cubitsVault
          : quantity;

      if (trueQuantity === 0) throw new VaultError.CubitsVaultFullError(prefix);

      const _profile = await ProfileService.addCubitsToVault(
        profile,
        trueQuantity
      );

      const embed = new MessageEmbed(`Vault`, msg.author)
        .setDescription(
          `✅ **Added __${trueQuantity}__ cubits to your vault!**\n${
            _profile.cubitsVault === _profile.cubitsVaultMax
              ? `Your cubits vault is now **full**!`
              : `You now have **${_profile.cubitsVault.toLocaleString()}** cubits in your vault.`
          }`
        )
        .setFooter(`💸 New balance: ${_profile.cubits.toLocaleString()}`);

      await this.send(msg.channel, embed);

      return;
    } else if (type === `cards`) {
      const cardsInVault = await CardService.getVaultedCards(profile);

      if (cardsInVault.length >= profile.cardsVaultMax)
        throw new VaultError.CardsVaultFullError(prefix);

      const cardIdentifiers = options
        .slice(1)
        .slice(0, profile.cardsVaultMax - cardsInVault.length);

      if (cardIdentifiers.length === 0)
        throw new VaultError.InvalidVaultCardIdentifierError(prefix);

      const cards = [];

      for (let id of cardIdentifiers) {
        const card = await CardService.getUserCardByIdentifier(id);

        if (card.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);

        if (card.vaulted)
          throw new VaultError.CardAlreadyInVaultError(prefix, card);

        cards.push(card);
      }

      await CardService.setCardsVaulted(cards);

      const embed = new MessageEmbed(`Vault`, msg.author).setDescription(
        `✅ **Added** \`${cards
          .map((c) => renderIdentifier(c))
          .join(`\`, \``)}\` **to your vault**!`
      );

      await this.send(msg.channel, embed);

      return;
    }
  }
}
