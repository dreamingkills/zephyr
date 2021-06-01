import { Zephyr } from "../client/Zephyr";
import { GameDBClub } from "../game/club/database/DBClub";
import { ZephyrError } from "./ZephyrError";

export class NotEnoughBitsToCreateClubError extends ZephyrError {
  constructor() {
    super(
      `**You don't have enough bits to do that!**\nCreating a club costs **${Zephyr.modifiers.clubCreationPrice.toLocaleString()}** bits.`
    );
  }
}

export class ClubLimitError extends ZephyrError {
  constructor() {
    super(
      `**You can't join any more clubs!**\nYou'll need to leave one first to join another.`
    );
  }
}

export class InvalidClubNameInCreationError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid name for your club!**\nPlease enter an available club name, up to 32 characters long.`
    );
  }
}

export class InvalidClubNameInViewerError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid club name!**\nRemember, they can only be up to 32 characters.`
    );
  }
}

export class NoClubByNameError extends ZephyrError {
  constructor() {
    super(
      `**There is no club by that name!**\nPlease make sure your spelling is correct.`
    );
  }
}

export class ClubNameTakenError extends ZephyrError {
  constructor() {
    super(
      `**That club name is already taken!**\nPlease enter an available club name, up to 32 characters long.`
    );
  }
}

export class IllegalClubNameError extends ZephyrError {
  constructor() {
    super(`That club name is banned. Please choose another.`);
  }
}

export class NotOwnerOfClubError extends ZephyrError {
  constructor() {
    super(
      `**You are not the owner of that club!**\nOnly the owner can change club settings.`
    );
  }
}

export class CannotPromoteYourselfError extends ZephyrError {
  constructor() {
    super(
      `**You can't promote yourself!**\nThe owner can only promote members to moderators.`
    );
  }
}

export class CannotDemoteYourselfError extends ZephyrError {
  constructor() {
    super(
      `**You can't demote yourself!**\nTo transfer ownership, check the club settings.`
    );
  }
}

export class AlreadyModeratorError extends ZephyrError {
  constructor() {
    super(
      `**That person is already a mod!**\nTo transfer ownership, check your club settings.`
    );
  }
}

export class AlreadyMemberError extends ZephyrError {
  constructor() {
    super(
      `**That person is already a member!**\nThey can't go any lower in the hierarchy.`
    );
  }
}

export class NotClubModeratorError extends ZephyrError {
  constructor() {
    super(
      `**You don't have permission to do that!**\nOnly club moderators and owners can perform that action.`
    );
  }
}

export class UserNotInClubError extends ZephyrError {
  constructor() {
    super(
      `**That person isn't in that club!**\nThey will need to join the club for you to do that.`
    );
  }
}

export class PermissionsConflictError extends ZephyrError {
  constructor() {
    super(
      `**You can't kick that person!**\nOnly the owner can kick moderators.`
    );
  }
}

export class CannotKickOwnerError extends ZephyrError {
  constructor() {
    super(
      `**You can't kick the owner!**\nAsk them to transfer ownership or abandon the club instead.`
    );
  }
}

export class AlreadyInClubError extends ZephyrError {
  constructor() {
    super(
      `**You're already a member of that club!**\nYou can't join a club you're already in!`
    );
  }
}

export class NotMemberOfClubError extends ZephyrError {
  constructor() {
    super(
      `**You are not a member of that club!**\nYou can't leave a club you aren't in!`
    );
  }
}

export class OwnerCannotLeaveClubError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**You are the owner of that club!**\nIf you'd like to abandon your club, use \`${prefix}abandon\`.`
    );
  }
}

export class ClubClosedError extends ZephyrError {
  constructor() {
    super(
      `**That club is closed!**\nYou'll need to be invited or wait for it to open to join.`
    );
  }
}

export class ClubAtCapacityError extends ZephyrError {
  constructor() {
    super(
      `**That club is full!**\nYou'll need to wait for a slot to open up to join.`
    );
  }
}

// Settings

export class InvalidClubSettingError extends ZephyrError {
  constructor(prefix: string, club: GameDBClub) {
    super(
      `**That club setting does not exist!**\nSee \`${prefix}cs ${club.name.toLowerCase()}\` for more information.`
    );
  }
}

export class InvalidClubSettingValueError extends ZephyrError {
  constructor(prefix: string, club: GameDBClub) {
    super(
      `**Please enter a valid value for that setting!**\nSee \`${prefix}cs ${club.name.toLowerCase()}\` for more information.`
    );
  }
}

export class ClubOpenStatusConflictError extends ZephyrError {
  constructor(open: boolean) {
    super(
      `**That club is already ${
        open ? `open` : `closed`
      }!**\nIf you'd like to ${open ? `close` : `open`} it, type "${
        open ? `no` : `yes`
      }" instead.`
    );
  }
}

export class InvalidTransferSnowflakeError extends ZephyrError {
  constructor() {
    super(
      `**Please enter a valid user to transfer ownership to!**\nYou can specify a user ID, or mention a user who is in the server.`
    );
  }
}

export * as ClubError from "./ClubError";
