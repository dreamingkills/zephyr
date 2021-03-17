import { User } from "eris";
import { GameAlbum } from "../game/Album";
import { GameBadge } from "../game/Badge";
import { GameBlacklist } from "../game/blacklist/Blacklist";
import { GameDye } from "../game/Dye";
import { GameIdol } from "../game/Idol";
import { GameTag } from "../game/Tag";
import { GameUserCard } from "../game/UserCard";
import { PrefabItem } from "../item/PrefabItem";
import { GamePoll } from "../poll/Poll";

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

/*
    Invalid Numerics
*/
export class InvalidAmountOfBitsError extends ZephyrError {
  constructor() {
    super(`Please enter a valid number of bits.`);
  }
}

export class InvalidPatronTierError extends ZephyrError {
  constructor() {
    super(`Please enter a valid tier.`);
  }
}

export class PrefixTooLongError extends ZephyrError {
  constructor() {
    super(`That prefix is too long. It must be 8 characters at most.`);
  }
}

export class NotAllowedInDMError extends ZephyrError {
  constructor() {
    super(`You cannot use that command in DM channels.`);
  }
}

export class AccountBlacklistedNoCaseError extends ZephyrError {
  constructor() {
    super(
      `You have been blacklisted. You must join [Zephyr Community](https://discord.gg/zephyr) to appeal.\nYou do not have a case open because you were blacklisted before the new system. Please appeal regardless.`
    );
  }
}
export class AccountBlacklistedError extends ZephyrError {
  constructor(blacklist: GameBlacklist) {
    super(
      `You have been blacklisted. You must join [Zephyr Community](https://discord.gg/zephyr) to appeal. Your Case ID is \`#${blacklist.id}\`.` /*\nModerator: **${
        blacklister?.tag || `Unknown User`
      }**`*/ // Removed due to popular demand
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

export class UnknownIdolError extends ZephyrError {
  constructor() {
    super(`There are no idols by that name.`);
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

export class NotEnoughBitsInBankError extends ZephyrError {
  constructor(_has: number, _needs: number) {
    super(`You don't have enough bits in your bank to do that.`);
  }
}

export class NotEnoughBitsError extends ZephyrError {
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

export class WishlistEmptyError extends ZephyrError {
  constructor() {
    super(`Your wishlist is already empty!`);
  }
}

export class InvalidWishlistNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid name to add to your wishlist.`);
  }
}

export class InvalidWishlistNameRemoveError extends ZephyrError {
  constructor() {
    super(`Please enter an idol to remove from your wishlist.`);
  }
}

export class DuplicateWishlistEntryError extends ZephyrError {
  constructor(idol: GameIdol, groups: string[]) {
    super(
      `**${idol.name}**${
        groups.length === 0 ? `` : ` (${groups.join(`, `)})`
      } is already on your wishlist.`
    );
  }
}

export class IdolNotOnWishlistError extends ZephyrError {
  constructor(idol: GameIdol, groups: string[]) {
    super(
      `**${idol.name}** (${
        groups.join(`, `) || `Soloist`
      }) is not on your wishlist.`
    );
  }
}

export class InvalidReminderTypeError extends ZephyrError {
  constructor() {
    super(`Please enter a valid reminder type.`);
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

export class TagNotFoundError extends ZephyrError {
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
  constructor(prefix: string) {
    super(
      `:warning: You have no tags!\nUse \`${prefix}createtag <tag name> <emoji>\` to make one.`
    );
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

export class CardAlreadyTaggedError extends ZephyrError {
  constructor(tag: GameTag, card: GameUserCard) {
    super(
      `\`${card.id.toString(36)}\` is already tagged as ${tag.emoji} **${
        tag.name
      }**.`
    );
  }
}

export class CardsAlreadyTaggedError extends ZephyrError {
  constructor(tag: GameTag) {
    super(
      `All cards you tagged are already tagged as ${tag.emoji} **${tag.name}**.`
    );
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

/*
    Dyes
          */
export class InvalidDyeIdentifierError extends ZephyrError {
  constructor() {
    super(`Please enter a valid Dye ID.\nThey look like this: \`$b8ew9\``);
  }
}

export class UnchargedDyeError extends ZephyrError {
  constructor(dye: GameDye) {
    super(`\`$${dye.id.toString(36)}\` has no charges!`);
  }
}

export class NotOwnerOfDyeError extends ZephyrError {
  constructor(dye: GameDye) {
    super(`\`$${dye.id.toString(36)}\` does not belong to you.`);
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
    super(
      `:fire: You cannot view \`${card.id.toString(
        36
      )}\` because it has been burned.`
    );
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
    HTTP
*/
export class MessageFailedToSendError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a message could not be sent. Please try again in a few minutes.`
    );
  }
}

export class FailedToAddReactionError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a reaction could not be added. Please try again in a few minutes.`
    );
  }
}

export class FailedToEditMessageError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a message could not be edited. Please try again in a few minutes.`
    );
  }
}

export class FailedToDeleteMessageError extends ZephyrError {
  constructor() {
    super(
      `There was a problem connecting to Discord, and a message could not be deleted. Please try again in a few minutes.`
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

export class AlbumNotFoundError extends ZephyrError {
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
    super(`\`${card.id.toString(36)}\` is currently in an album.`);
  }
}

export class CardAlreadyInAlbumError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` is already in an album.`);
  }
}

export class CardNotInAlbumError extends ZephyrError {
  constructor(card: GameUserCard) {
    super(`\`${card.id.toString(36)}\` is not in an album.`);
  }
}

export class AlbumEmptyError extends ZephyrError {
  constructor(album: GameAlbum) {
    super(`\`${album.name}\` is already empty.`);
  }
}

export class NotEnoughCurrencyToBuyError extends ZephyrError {
  constructor(type: string, amount: number) {
    super(`You need **${amount.toLocaleString()} ${type}** to buy that.`);
  }
}

export class CannotReactError extends ZephyrError {
  constructor() {
    super(
      `I cannot react to messages here. Please make sure I have the \`Add Reactions\` permission.`
    );
  }
}

export class CannotAttachFilesError extends ZephyrError {
  constructor() {
    super(
      `I cannot attach files here. Please make sure I have the \`Attach Files\` permission.`
    );
  }
}

export class TooManyError extends ZephyrError {
  constructor() {
    super(`That would exceed the integer limit (4,294,967,295).`);
  }
}

/*
    Boosters
              */
export class BoosterActiveError extends ZephyrError {
  constructor(expiry: string) {
    super(
      `You already have a booster active.\nIt expires at **${expiry} UTC**.`
    );
  }
}

/*
    Autotag
             */
export class AutotagIdNotFoundError extends ZephyrError {
  constructor(id: number) {
    super(`I couldn't find an autotag with id \`${id}\`.`);
  }
}

export class InvalidAutotagTypeError extends ZephyrError {
  constructor() {
    super(
      `Please enter a valid autotag type (group, idol, condition, or issue).`
    );
  }
}

export class InvalidConditionError extends ZephyrError {
  constructor() {
    super(`Please enter a valid condition, represented by a number 0 to 5.`);
  }
}

export class InvalidIssueError extends ZephyrError {
  constructor() {
    super(`Please enter a valid issue, greater than 0 and less than 65,535.`);
  }
}

export class DuplicateAutotagGroupError extends ZephyrError {
  constructor() {
    super(
      `That group is already bound to one of your autotags.\nPlease delete the existing autotag before creating another.`
    );
  }
}

export class DuplicateAutotagIdolError extends ZephyrError {
  constructor() {
    super(
      `That idol is already bound to one of your autotags.\nPlease delete the existing autotag before creating another.`
    );
  }
}

export class DuplicateAutotagWearError extends ZephyrError {
  constructor() {
    super(
      `That condition is already bound to one of your autotags.\nPlease delete the existing autotag before creating another.`
    );
  }
}

export class DuplicateAutotagIssueError extends ZephyrError {
  constructor() {
    super(
      `That issue is already bound to one of your autotags.\nPlease delete the existing autotag before creating another.`
    );
  }
}

/*
    Polls
*/
export class InvalidPollIdError extends ZephyrError {
  constructor() {
    super(`Please enter a valid Poll ID.`);
  }
}

export class PollDoesNotExistError extends ZephyrError {
  constructor(id: number) {
    super(`There is no poll with ID \`${id}\`.`);
  }
}

export class PollAlreadyActivatedError extends ZephyrError {
  constructor(poll: GamePoll) {
    super(`**Poll #${poll.id}: ${poll.title}** is already activated.`);
  }
}

export class PollAlreadyDeactivatedError extends ZephyrError {
  constructor(poll: GamePoll) {
    super(`**Poll #${poll.id}: ${poll.title}** is already deactivated.`);
  }
}

export class InvalidPollTitleError extends ZephyrError {
  constructor() {
    super(`Please enter a valid poll title.`);
  }
}

export class InvalidPollDescriptionError extends ZephyrError {
  constructor() {
    super(`Please enter a valid poll description.`);
  }
}

export class InvalidPollEndTimeError extends ZephyrError {
  constructor() {
    super(`Please enter a valid poll end time.`);
  }
}

export class PollInactiveError extends ZephyrError {
  constructor(poll: GamePoll) {
    super(`**Poll #${poll.id}: ${poll.title}** is not currently active.`);
  }
}

export class PollAnsweredError extends ZephyrError {
  constructor(poll: GamePoll) {
    super(`You have already answered **Poll #${poll.id}: ${poll.title}**.`);
  }
}

export class PollAnswerDoesNotExistError extends ZephyrError {
  constructor() {
    super(`There is no answer by that ID.`);
  }
}

export class InvalidPollAnswerError extends ZephyrError {
  constructor() {
    super(`Please enter a valid poll answer (yes/no).`);
  }
}

/*
    Blacklist
*/
export class InvalidBlacklistIdError extends ZephyrError {
  constructor() {
    super(`Please enter a valid Case ID.`);
  }
}

export class BlacklistDoesNotExistError extends ZephyrError {
  constructor() {
    super(`There is no case with that ID.`);
  }
}

export class InvalidBlacklistReasonError extends ZephyrError {
  constructor() {
    super(`You must specify a reason to blacklist.`);
  }
}

export class UserAlreadyBlacklistedError extends ZephyrError {
  constructor(user: User) {
    super(`**${user.tag}** is already blacklisted.`);
  }
}

export class CaseAlreadyQuashedError extends ZephyrError {
  constructor(blacklist: GameBlacklist) {
    super(`\`Case #${blacklist.id}\` has already been quashed.`);
  }
}

export class InvalidQuashNoteError extends ZephyrError {
  constructor() {
    super(`You must write a quash note in order to quash a blacklist.`);
  }
}

export class TooManyItemsInMultitradeError extends ZephyrError {
  constructor() {
    super(`You have reached the multitrade limit. Please split up your trade.`);
  }
}

/*
    Badges
*/
export class BadgeNotFoundError extends ZephyrError {
  constructor(id: number) {
    super(`There is no badge with ID \`${id}\`.`);
  }
}

export class UserBadgeNotFoundError extends ZephyrError {
  constructor(id: number) {
    super(`There is no user badge with ID \`${id}\`.`);
  }
}

export class BadgeNameNotFoundError extends ZephyrError {
  constructor(name: string) {
    super(`There is no badge named \`${name}\`.`);
  }
}

export class BadgeEmojiNotFoundError extends ZephyrError {
  constructor(emoji: string) {
    super(`There is no badge with emoji ${emoji}.`);
  }
}

export class InvalidBadgeNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid badge name.`);
  }
}

export class InvalidBadgeEmojiError extends ZephyrError {
  constructor() {
    super(`Please enter a valid badge emoji.`);
  }
}

export class DuplicateBadgeNameError extends ZephyrError {
  constructor() {
    super(`There is already a badge with that name.`);
  }
}

export class DuplicateBadgeEmojiError extends ZephyrError {
  constructor() {
    super(`There is already a badge with that emoji.`);
  }
}

export class DuplicateUserBadgeError extends ZephyrError {
  constructor(user: User, badge: GameBadge) {
    super(
      `**${user.tag}** already has ${badge.badgeEmoji} **${badge.badgeName}**.`
    );
  }
}

export class UserLacksBadgeError extends ZephyrError {
  constructor(user: User, badge: GameBadge) {
    super(
      `**${user.tag}** does not have ${badge.badgeEmoji} **${badge.badgeName}**.`
    );
  }
}

/*
    Flags
*/
export class DropFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but dropping is temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class TradeFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but trades, multitrades, and gifts are temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class ReminderFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but reminders are temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class TransactionFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but paying, the bank, and the shop are temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class DyeFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but dyes are temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class UpgradeFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but upgrades are temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class BurnFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but burning is temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class CraftingFlagDisabledError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but crafting is temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class InvalidFlagNameError extends ZephyrError {
  constructor() {
    super(`Please enter a valid flag name.`);
  }
}

export class FlagNotFoundError extends ZephyrError {
  constructor() {
    super(`There is no flag by that name.`);
  }
}

export class InvalidFlagValueError extends ZephyrError {
  constructor() {
    super(`Please enter a valid flag value (true/false).`);
  }
}

export class MainViewingFlagDisabledError extends ZephyrError {
  constructor() {
    super(`Sorry, but viewing cards is currently disabled in this channel.`);
  }
}

export class ConfiscatedTokenFlagDisabledError extends ZephyrError {
  constructor(item: PrefabItem) {
    super(
      `Sorry, but use of the **${item.names[0]}** is temporarily disabled.\nPlease join [Zephyr Community](https://discord.gg/zephyr) to stay up to date.`
    );
  }
}

export class NoAvailableConfiscatedCardsError extends ZephyrError {
  constructor() {
    super(
      `Sorry, but there are no available confiscated cards. Please try again later.`
    );
  }
}

export class ItemSoulboundError extends ZephyrError {
  constructor(item: PrefabItem) {
    super(`\`${item.names[0]}\` is a soulbound item and cannot be traded.`);
  }
}
