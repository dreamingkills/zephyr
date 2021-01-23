import { User } from "eris";
import { GameTag } from "../game/Tag";
import { GameUserCard } from "../game/UserCard";
import { PrefabItem } from "../item/PrefabItem";

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

export class UnexpectedError extends ZephyrError {
  constructor(e: any) {
    super(
      `An unexpected error occurred. This has been reported to the developer.`
    );
    console.log(e);
  }
}
export class PrefixTooLongError extends ZephyrError {
  constructor() {
    super(`That prefix is too long. It must be 8 characters at most.`);
  }
}

export class NotAllowedInDMError extends ZephyrError {
  constructor() {
    super(`You cannot do that here.`);
  }
}

export class DropsDisabledError extends ZephyrError {
  constructor() {
    super(
      `Drops are currently disabled, likely because the bot will restart soon. Please try again in a couple minutes.`
    );
  }
}

export class AccountBlacklistedError extends ZephyrError {
  constructor() {
    super(
      `You have been blacklisted. If you think this is in error, please join the support server by clicking [here](https://discord.gg/7PFyqUvKYs).`
    );
  }
}

export class AccountBlacklistedOtherError extends ZephyrError {
  constructor() {
    super(`That user is blacklisted and cannot be interacted with.`);
  }
}

export class InvalidMentionError extends ZephyrError {
  constructor() {
    super(`Please mention a user.`);
  }
}

export class InvalidUserArgumentError extends ZephyrError {
  constructor() {
    super(`Please mention someone or provide their User ID.`);
  }
}

export class InvalidMentionGiftError extends ZephyrError {
  constructor(plural: boolean) {
    super(
      `Please mention someone to gift your ${plural ? `cards` : `card`} to.`
    );
  }
}

export class InvalidMentionItemError extends ZephyrError {
  constructor(plural: boolean) {
    super(`Please mention someone to gift your item${plural ? `s` : ``} to.`);
  }
}

export class NoItemsSpecifiedError extends ZephyrError {
  constructor() {
    super(`Please specify some items.`);
  }
}

export class UnspecifiedItemError extends ZephyrError {
  constructor() {
    super(`Please specify an item.`);
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

export class InvalidHelpQueryError extends ZephyrError {
  constructor() {
    super(`Sorry, but I couldn't find a command by that name.`);
  }
}

/*
    Lookup
            */
export class InvalidLookupQueryError extends ZephyrError {
  constructor() {
    super(`Please enter a valid search term.`);
  }
}

export class NoResultsFoundInLookupError extends ZephyrError {
  constructor() {
    super(`I couldn't find anyone using that search term.`);
  }
}

export class LookupQueryTooBroadError extends ZephyrError {
  constructor() {
    super(`That search is too broad. Please narrow it down.`);
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
  constructor(user?: string) {
    super(`${user ? `**${user}**'s` : `That user's`} profile is private.`);
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

export class NotEnoughBitsToUpgradeError extends ZephyrError {
  constructor(needs: number) {
    super(`You need **${needs.toLocaleString()}** bits to do that.`);
  }
}

export class NotEnoughDustError extends ZephyrError {
  constructor(has: number, needs: number, tier: number) {
    super(
      `You need **${needs.toLocaleString()}x** Card Dust \`${"★"
        .repeat(tier)
        .padEnd(5, "☆")}\` to do that.\nYou have **${has.toLocaleString()}**.`
    );
  }
}

export class NotEnoughCubitsError extends ZephyrError {
  constructor(_has: number, needs: number) {
    super(`You need \`${needs}\` cubits to buy that.`);
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

export class InvalidWishlistNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid name to add to your wishlist.`);
  }
}

export class DuplicateWishlistEntryError extends ZephyrError {
  constructor(name: string, groupName?: string) {
    super(
      `${
        groupName ? `**${groupName}** ` : ``
      }${name} is already on your wishlist.`
    );
  }
}

export class InvalidReminderTypeError extends ZephyrError {
  constructor() {
    super(`Please enter a valid reminder type.`);
  }
}

export class ReminderSpamError extends ZephyrError {
  constructor() {
    super(
      `Please wait at least 10 seconds before switching your reminder status again.`
    );
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
    super(`You don't have any \`${item}\`.`);
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

export class CannotRemoveFrameError extends ZephyrError {
  constructor() {
    super(`You cannot remove that frame.`);
  }
}

export class InvalidItemArgumentsError extends ZephyrError {
  constructor(item: PrefabItem, prefix: string) {
    super(
      `Please specify valid parameters to use that item.\nSee \`${prefix}iteminfo ${item.names[0].toLowerCase()}\` for more information.`
    );
  }
}

export class ItemSelfRetrievalError extends ZephyrError {
  constructor(itemName: string) {
    super(
      `There was an error obtaining a self-reference to \`${itemName}\`. Your items have not been consumed.`
    );
  }
}

export class ItemMissingError extends ZephyrError {
  constructor(itemName: string) {
    super(
      `There was an error obtaining the item ${itemName}. It does not exist, but it should.`
    );
  }
}

/*
    Timers
            */
export class DropCooldownError extends ZephyrError {
  constructor(until: string) {
    super(`You must wait **${until || `<1s`}** before dropping cards again.`);
  }
}

export class ClaimCooldownError extends ZephyrError {
  constructor(until: string, userId: string) {
    super(
      `<@${userId}>, you must wait **${
        until || `<1s`
      }** before claiming another card.`
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

export class CardBestConditionError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` is already in Mint condition.`);
  }
}

/*
    Tags
          */
export class UnspecifiedTagInCreationError extends ZephyrError {
  constructor() {
    super(
      `Please enter a valid name for your tag.` +
        `\nTags must be 12 characters or less.`
    );
  }
}

export class UnspecifiedTagError extends ZephyrError {
  constructor() {
    super(`Please enter a tag.`);
  }
}

export class InvalidTagError extends ZephyrError {
  constructor(name: string) {
    super(`You don't have a tag named \`${name}\`.`);
  }
}

export class InvalidEmojiTagError extends ZephyrError {
  constructor() {
    super(`Please enter a valid emoji for your tag.`);
  }
}

export class TagContainsSpacesError extends ZephyrError {
  constructor() {
    super(`Your tag cannot include spaces.`);
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
  constructor(name: string) {
    super(`You already have a tag named \`${name}\`.`);
  }
}

export class DuplicateTagEmojiError extends ZephyrError {
  constructor(emoji: string) {
    super(`You already have a tag using ${emoji}.`);
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

export class NoCardsTaggedError extends ZephyrError {
  constructor(tag: GameTag) {
    super(`You have no cards tagged ${tag.emoji} \`${tag.name}\`.`);
  }
}

export class NoUntaggedCardsError extends ZephyrError {
  constructor() {
    super(`You have no untagged cards.`);
  }
}

export class UnspecifiedGroupError extends ZephyrError {
  constructor() {
    super(`Please enter the name of a group.`);
  }
}

export class InvalidGroupError extends ZephyrError {
  constructor() {
    super(`There is no group by that name.`);
  }
}

export class UnsetZephyrChannelError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `This server doesn't have a Zephyr channel set.` +
        `\nUse \`${prefix}setchannel\` in a channel of your choosing to set it up.`
    );
  }
}

export class CannotDropInChannelError extends ZephyrError {
  constructor(channelId?: string) {
    super(
      channelId
        ? `You can only drop cards in <#${channelId}>!`
        : `You cannot drop cards in this channel.`
    );
  }
}

export class InvalidDustTypeError extends ZephyrError {
  constructor() {
    super(`That is not a valid type of dust.`);
  }
}

/*
    Dyes
          */
export class InvalidDyeIdentifierError extends ZephyrError {
  constructor() {
    super(`Please enter a valid Dye ID.\nThey look like this: \`$b8ew9\``);
  }
}

export class UnchargedDyeError extends ZephyrError {
  constructor(id: number) {
    super(`\`$${id.toString(36)}\` has no charges!`);
  }
}

export class NotOwnerOfDyeError extends ZephyrError {
  constructor(id: number) {
    super(`\`$${id.toString(36)}\` does not belong to you.`);
  }
}

export class DyeDoesNotExistError extends ZephyrError {
  constructor(id: number) {
    super(`\`$${id.toString(36)}\` does not exist.`);
  }
}

export class CardConditionTooLowError extends ZephyrError {
  constructor(_wear: number, requirement: number) {
    super(
      `Your card must be in **${
        ["Damaged", "Poor", "Average", "Good", "Great", "Mint"][requirement]
      }** condition to do that!`
    );
  }
}

/*
    Crafting
              */
export class UnspecifiedRecipeError extends ZephyrError {
  constructor() {
    super(`Please specify a recipe to craft.`);
  }
}

export class RecipeNotFoundError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but there is no recipe by that name.\nPlease ensure your spelling is correct.`
    );
  }
}

export class NotEnoughOfItemError extends ZephyrError {
  constructor(item: string) {
    super(`Sorry, but you don't have enough **${item}** to craft that.`);
  }
}

/*
    Burning
             */
export class CardBurnedError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`:fire: \`${card.id.toString(36)}\` was burned.`);
  }
}

export class UnspecifiedBurnTargetsError extends ZephyrError {
  constructor() {
    super(`Please specify one or more cards or dyes to burn.`);
  }
}

export class InvalidDyeIdentifierBurnError extends ZephyrError {
  constructor(invalid: string) {
    super(`\`${invalid}\` is not a valid dye identifier.`);
  }
}

export class InvalidCardIdentifierBurnError extends ZephyrError {
  constructor(invalid: string) {
    super(`\`${invalid}\` is not a valid card identifier.`);
  }
}

export class UnspecifiedBurnTagsError extends ZephyrError {
  constructor() {
    super(`Please specify a tag to burn.`);
  }
}

/*
    Trading
             */
export class InvalidCardIdentifierTradeError extends ZephyrError {
  constructor() {
    super(`Please specify two valid cards in your trade.`);
  }
}
export class TradeeNotOwnerOfCardError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`The person you mentioned does not own \`${card.id.toString(36)}\`.`);
  }
}
export class UnacceptableTradeTargetError extends ZephyrError {
  constructor() {
    super(`You cannot trade with yourself or Zephyr.`);
  }
}

/*
    Patreon
             */
export class NotAPatronError extends ZephyrError {
  constructor() {
    super(`Sorry, you must be a $3+ Patron or higher to claim that reward.`);
  }
}

/*
    Stickers
              */
export class TooManyStickersError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` has three stickers already.`);
  }
}

export class StickerSlotTakenError extends ZephyrError {
  constructor(card: GameUserCard, slot: number) {
    super(
      `Sticker slot \`${slot}\` on \`${card.id.toString(
        36
      )}\` is already occupied.`
    );
  }
}

export class NoStickerInSlotError extends ZephyrError {
  constructor(card: GameUserCard, slot: number) {
    super(
      `There is no sticker in slot \`${slot}\` on \`${card.id.toString(36)}\`.`
    );
  }
}

export class NoStickerBoundToItemError extends ZephyrError {
  constructor(item: PrefabItem) {
    super(
      `\`${item.names[0]}\` is not bound to a sticker. Please report this bug.`
    );
  }
}

export class InvalidStickerError extends ZephyrError {
  constructor() {
    super(`Please enter a valid sticker name.`);
  }
}

/*
    Shop v2
*/
export class ItemNotForSaleError extends ZephyrError {
  constructor(item: PrefabItem) {
    super(`\`${item.names[0]}\` is not currently available for purchase.`);
  }
}

/*
    HTTP
*/
export class MessageFailedToSendError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a message could not be sent. Please try again in a few minutes.\nThis has been reported to the developer.`
    );
  }
}

export class FailedToAddReactionError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a reaction could not be added. Please try again in a few minutes.\nThis has been reported to the developer.`
    );
  }
}

export class FailedToEditMessageError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a message could not be edited. Please try again in a few minutes.\nThis has been reported to the developer.`
    );
  }
}

/*
    Albums
*/
export class NonexistentAlbumIdError extends ZephyrError {
  constructor() {
    super(`No album exists with that ID.`);
  }
}

export class NonexistentAlbumNameError extends ZephyrError {
  constructor(target?: User) {
    super(
      (target ? `${target.tag} has` : `You have`) + ` no albums by that name.`
    );
  }
}

export class InvalidAlbumNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid album name.`);
  }
}

export class InvalidAlbumNameCreationError extends ZephyrError {
  constructor() {
    super(
      `Please enter a valid album name.\nThey must be **less than or equal to 12 characters** and contain **no spaces**.\nEmoji and symbols are **permitted**.`
    );
  }
}

export class UnspecifiedNewAlbumNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid name to change your album to.`);
  }
}

export class AlbumNameTakenError extends ZephyrError {
  constructor(name: string) {
    super(`You already have an album named \`${name}\`.`);
  }
}

export class NotEnoughAlbumPagesError extends ZephyrError {
  constructor() {
    super(`You don't have enough pages in your album for that.`);
  }
}

export class AlbumFullError extends ZephyrError {
  constructor() {
    super(`That album is full!`);
  }
}

export class AlbumPageFullError extends ZephyrError {
  constructor() {
    super(`That page is full!`);
  }
}

export class AlbumSlotTakenError extends ZephyrError {
  constructor() {
    super(`That slot is already taken.`);
  }
}

export class InvalidPageError extends ZephyrError {
  constructor() {
    super(`Please enter a valid page number.`);
  }
}

export class InvalidSlotError extends ZephyrError {
  constructor() {
    super(`Please enter a valid slot.`);
  }
}

export class CardInAlbumError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` is already in an album.`);
  }
}

export class CardNotInAlbumError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` is not in an album.`);
  }
}

export class NotEnoughCurrencyToBuyError extends ZephyrError {
  constructor(type: string, amount: number) {
    super(`You need **${amount.toLocaleString()} ${type}** to buy that.`);
  }
}
