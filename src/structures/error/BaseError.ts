export abstract class BaseError extends Error {
  name = `BaseError`;
  message = `An unknown error occurred.`;
  isClientFacing = true;
  header = `Error`;
}
