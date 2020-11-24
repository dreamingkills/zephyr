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
