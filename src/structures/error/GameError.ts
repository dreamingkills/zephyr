abstract class BaseGameError extends Error {
  name = "BaseGameError";
  message: string;
  isClientFacing = true;
  header = "Error";
  constructor(message: string) {
    super();
    this.message = message;
  }
}

/*
    Profile
             */
export class NoProfileError extends BaseGameError {
  constructor() {
    super(`NO Profile Error`);
  }
}
