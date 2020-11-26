import {
  CardReference,
  CardService,
} from "../../lib/database/services/game/CardService";
import { GameBaseCard } from "../game/BaseCard";
import { GameUserCard } from "../game/UserCard";

abstract class ZephyrError extends Error {
  name = "ZephyrError";
  message: string;
  isClientFacing = true;
  header = "Error";
  constructor(message: string) {
    super();
    this.message = message;
  }
}

export class InvalidMentionError extends ZephyrError {
  constructor() {
    super(`Please mention a user.`);
  }
}
export class InvalidAmountError extends ZephyrError {
  constructor(type: string) {
    super(`Please enter a valid number of **${type}**.`);
  }
}
export class InvalidSnowflakeError extends ZephyrError {
  constructor() {
    super(`Please enter a valid User ID.`);
  }
}
export class UserNotFoundError extends ZephyrError {
  constructor() {
    super(`Sorry, but I couldn't find that user.`);
  }
}
/*
    Profile
             */
export class NoProfileError extends ZephyrError {
  constructor(user: string) {
    super(`${user} hasn't played Zephyr yet.`);
  }
}
export class PrivateProfileError extends ZephyrError {
  constructor(user: string) {
    super(`**${user}**'s profile is private.`);
  }
}
export class NotEnoughBitsError extends ZephyrError {
  constructor(_has: number, _needs: number) {
    super(`You don't have enough bits to do that.`);
  }
}
export class NotEnoughBitsInBankError extends ZephyrError {
  constructor(_has: number, _needs: number) {
    super(`You don't have enough bits in your bank to do that.`);
  }
}
/*
    Cards
           */
export class InvalidCardReferenceError extends ZephyrError {
  constructor() {
    super(`Please enter a valid card reference.`);
  }
}
export class UnknownUserCardIdError extends ZephyrError {
  constructor() {
    super(`I could not find that card.`);
  }
}
export class UnknownUserCardError extends ZephyrError {
  constructor(ref: CardReference) {
    super(`**${`${ref.identifier}#${ref.serialNumber}`}** does not exist.`);
  }
}
export class NotOwnerOfCardError extends ZephyrError {
  constructor(card: GameUserCard, base: GameBaseCard) {
    super(
      `**${CardService.parseReference(card, base)}** does not belong to you.`
    );
  }
}
