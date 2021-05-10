import { GameIdol } from "../game/Idol";
import { GameTag } from "../game/Tag";
import { ZephyrError } from "./ZephyrError";

export class InvalidAutotagTypeError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**Please enter a valid autotag type!**\nSee \`${prefix}help cat\` for more information.`
    );
  }
}

export class AutotagLimitReachedError extends ZephyrError {
  constructor(isMaxPatron: boolean, prefix: string) {
    super(
      `**You have reached the autotag limit!**\n${
        isMaxPatron
          ? `You're already the highest tier patron...`
          : `You can \`${prefix}donate\` to the bot to receive more slots!`
      }`
    );
  }
}

export class InvalidTagNameError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid tag name!**\nYou can't autotag to a nonexistent tag!`
    );
  }
}

export class InvalidIdolNameError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid idol name!**\nYou can't autotag a nonexistent idol!`
    );
  }
}

export class InvalidGroupNameError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid group name!**\nYou can't autotag a nonexistent group!`
    );
  }
}

export class InvalidConditionError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid condition!**\nYou can't autotag a nonexistent condition!`
    );
  }
}

export class InvalidIssueError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid issue!**\nYou can't autotag a nonexistent issue!`
    );
  }
}

export class TagNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**You don't have a tag by that name!**\nMake sure your spelling is correct!`
    );
  }
}

export class IdolNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**I couldn't find an idol by that name!**\nMake sure your spelling is correct!`
    );
  }
}

export class GroupNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**I couldn't find a group by that name!**\nMake sure your spelling is correct!`
    );
  }
}

export class ConditionNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**There is no condition by that name!**\nTry \`damaged\`, \`poor\`, \`average\`, \`good\`, \`great\`, or \`mint\`!`
    );
  }
}

export class IssueOutOfBoundsError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid issue!**\nIt must be greater than 0 and less than 65,535.`
    );
  }
}

export class DuplicateIdolConstraintError extends ZephyrError {
  constructor(idol: GameIdol, tag: GameTag, groups: string[]) {
    super(
      `**That idol is already being autotagged!**\n**${
        idol.name
      }** (${groups.join(`, `)}) is currently being tagged ${tag.emoji} **${
        tag.name
      }**.`
    );
  }
}

export class DuplicateGroupConstraintError extends ZephyrError {
  constructor(groupName: string, tag: GameTag) {
    super(
      `**That group is already being autotagged!**\n**${groupName}** is currently being tagged ${tag.emoji} **${tag.name}**.`
    );
  }
}

export class DuplicateWearConstraintError extends ZephyrError {
  constructor(wear: string, tag: GameTag) {
    super(
      `**That condition is already being autotagged!**\n**${wear}** cards are currently being tagged ${tag.emoji} **${tag.name}**.`
    );
  }
}

export class DuplicateIssueConstraintError extends ZephyrError {
  constructor(issue: number, tag: GameTag) {
    super(
      `**That issue is already being autotagged!**\n**#${issue}** cards are currently being tagged ${tag.emoji} **${tag.name}**.`
    );
  }
}

export class InvalidPriorityError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid autotag priority!**\nIt should be a number greater than 0 and less than 256!`
    );
  }
}

export class PriorityNotFoundError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**You don't have an autotag with that priority!**\nUse \`${prefix}at\` to view your autotags - it's the number on the left!`
    );
  }
}

export class RedundantPrioritySwitchError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a new, non-occupied priority value!**\nIt should be a number greater than 0 and less than 256!`
    );
  }
}

export class PrioritySlotOccupiedError extends ZephyrError {
  constructor() {
    super(
      `**That priority slot is already occupied!**\nTry a new number greater than 0 and less than 256!`
    );
  }
}

export class UnexpectedDeletionError extends ZephyrError {
  constructor() {
    super(
      `There was an unexpected error attempting to delete that autotag.\nThis incident has been reported.`
    );
  }
}

export class UnexpectedPriorityChangeError extends ZephyrError {
  constructor() {
    super(
      `There was an unexpected error attempting to change the priority of that autotag.\nThis incident has been reported.`
    );
  }
}

export * as AutotagError from "./AutotagError";
