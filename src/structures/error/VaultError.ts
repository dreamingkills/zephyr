import { renderIdentifier } from "../../lib/utility/text/TextUtils";
import { GameUserCard } from "../game/UserCard";
import { BaseError } from "./BaseError";

export class InvalidVaultTypeError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Please type something to add to your vault!**\nValid types are \`bits\`, \`cubits\`, and \`cards\`!\n*See \`${prefix}help va\` for more information!*`;
  }
}

export class InvalidVaultBitsQuantityError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Please enter a valid number of bits!**\n*See \`${prefix}help va\` for more information!*`;
  }
}

export class InvalidVaultCubitsQuantityError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Please enter a valid number of cubits!**\n*See \`${prefix}help va\` for more information!*`;
  }
}

export class InvalidVaultCardIdentifierError extends BaseError {
  constructor(prefix: string) {
    super();

    `**Please enter a valid card code!**\n*See \`${prefix}help va\` for more information!*`;
  }
}

export class BitsVaultFullError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Your bits vault is full!**\nYou can withdraw some by using \`${prefix}vr bits <number>\`!`;
  }
}

export class CubitsVaultFullError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Your cubits vault is full!**\nYou can withdraw some by using \`${prefix}vr cubits <number>\`!`;
  }
}

export class CardsVaultFullError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**Your card vault is full!**\nYou can withdraw some by using \`${prefix}vr cards <cards>\`!`;
  }
}

export class NotEnoughBitsInVaultError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**You don't have enough bits in your vault to do that!**\nYou can add some by using \`${prefix}va bits <number>\`!`;
  }
}

export class NotEnoughCubitsInVaultError extends BaseError {
  constructor(prefix: string) {
    super();

    this.message = `**You don't have enough cubits in your vault to do that!**\nYou can add some by using \`${prefix}va cubits <number>\`!`;
  }
}

export class CardNotInVaultError extends BaseError {
  constructor(prefix: string, card: GameUserCard) {
    super();

    this.message = `**The card** \`${card.id.toString(
      36
    )}\` **is not in your vault!**\nYou can add it by using \`${prefix}va cards ${card.id.toString(
      36
    )}\`!`;
  }
}

export class CardAlreadyInVaultError extends BaseError {
  constructor(prefix: string, card: GameUserCard) {
    super();

    this.message = `**The card** \`${card.id.toString(
      36
    )}\` **is already in your vault!**\nYou can remove it by using \`${prefix}vr cards ${card.id.toString(
      36
    )}\`!`;
  }
}

export class CardInVaultError extends BaseError {
  constructor(card: GameUserCard) {
    super();

    this.message = `\`${renderIdentifier(card)}\` is currently in your vault!`;
  }
}

export * as VaultError from "./VaultError";
