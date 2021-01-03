import { Message } from "eris";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export async function addReaction(
  message: Message,
  reaction: string
): Promise<void> {
  let attempts = 0;
  let completed = false;

  while (attempts < 3 && !completed) {
    try {
      attempts++;
      await message.addReaction(reaction);
      completed = true;
    } catch (e) {
      if (attempts === 3) {
        console.log(
          `Failed trying to add reaction ${reaction} to message ${message.id}. Full stack:\n${e}`
        );
      }
    }
  }

  if (!completed) throw new ZephyrError.FailedToAddReactionError();
  return;
}
