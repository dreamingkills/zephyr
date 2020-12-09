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
export class InvalidMentionGiftError extends ZephyrError {
  constructor(plural: boolean) {
    super(
      `Please mention someone to gift your ${plural ? `cards` : `card`} to.`
    );
  }
}
export class CannotGiftAuthorError extends ZephyrError {
  constructor() {
    super(`You can't gift cards to yourself.`);
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
export class CannotPayYourselfError extends ZephyrError {
  constructor() {
    super(`You can't give bits to yourself.`);
  }
}
export class WishlistFullError extends ZephyrError {
  constructor(patron: number, prefix: string) {
    super(
      `Your wishlist is full!` +
        (patron >= 4
          ? ``
          : `\nYou can get more slots by becoming a patron! Use \`${prefix}patreon\` to find out more!`)
    );
  }
}
export class WishlistEntryTooLongError extends ZephyrError {
  constructor() {
    super(`Wishlist entries must be 12 characters or less.`);
  }
}
export class WishlistEmptyError extends ZephyrError {
  constructor() {
    super(`Your wishlist is already empty!`);
  }
}
export class InvalidWishlistEntryError extends ZephyrError {
  constructor() {
    super(`Please enter a valid item from your wishlist.`);
  }
}
/*
    Items
           */
export class InvalidItemError extends ZephyrError {
  constructor() {
    super(`That item doesn't exist.`);
  }
}
export class NoItemInInventoryError extends ZephyrError {
  constructor(item: string) {
    super(`You don't have any **${item}**.`);
  }
}
export class InvalidFrameError extends ZephyrError {
  constructor() {
    super(
      `I couldn't find that frame.\nPlease ensure your spelling is correct.`
    );
  }
}
export class NoFrameSpecifiedError extends ZephyrError {
  constructor() {
    super(`Please specify a frame to preview.`);
  }
}
/*
    Timers
            */
export class DropCooldownError extends ZephyrError {
  constructor(until: string) {
    super(`You must wait **${until}** before dropping cards again.`);
  }
}
export class ClaimCooldownError extends ZephyrError {
  constructor(until: string, userId: string) {
    super(
      `<@${userId}>, you must wait **${until}** before claiming another card.`
    );
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
  constructor(identifier: string) {
    super(`\`${identifier}\` does not exist.`);
  }
}
export class NotOwnerOfCardError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` does not belong to you.`);
  }
}
export class FrameAlreadyDefaultError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` already has the default frame.`);
  }
}

/*
    Tags
          */
export class UnspecifiedTagInCreationError extends ZephyrError {
  constructor() {
    super(
      `Please enter a valid name for your tag.` +
        `\nTags must be 6 characters or less.`
    );
  }
}
export class UnspecifiedTagError extends ZephyrError {
  constructor() {
    super(`Please enter a tag to add to your card.`);
  }
}
export class InvalidTagError extends ZephyrError {
  constructor() {
    super(`You don't have a tag by that name.`);
  }
}
export class InvalidEmojiTagError extends ZephyrError {
  constructor() {
    super(`Please enter a valid emoji for your tag.`);
  }
}
export class NoTagsError extends ZephyrError {
  constructor() {
    super(`You have no tags.`);
  }
}
export class TagsFullError extends ZephyrError {
  constructor(patron: number, prefix: string) {
    super(
      `Your tags are full!` +
        (patron >= 4
          ? ``
          : `\nYou can get more slots by becoming a patron! Use \`${prefix}patreon\` to find out more!`)
    );
  }
}
export class DuplicateTagError extends ZephyrError {
  constructor() {
    super(`You already have a tag by that name.`);
  }
}
export class NoParametersInTagEditError extends ZephyrError {
  constructor() {
    super(`Please specify valid parameters to edit your tag.`);
  }
}
export class CardsNotTaggedError extends ZephyrError {
  constructor(plural: boolean) {
    super(
      plural ? `None of those cards are tagged.` : `That card is not tagged.`
    );
  }
}
