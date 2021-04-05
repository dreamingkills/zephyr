import { Message } from "eris";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { retryOperation } from "../Retry";

export async function addReaction(
  message: Message,
  reaction: string
): Promise<void> {
  await retryOperation(
    async () => message.addReaction(reaction),
    10000,
    3
  ).catch((e) => {
    console.log(
      `Failed trying to add reaction ${reaction} to message ${message.id}. Full stack:\n${e.stack}`
    );
    throw new ZephyrError.FailedToAddReactionError();
  });

  return;
}
