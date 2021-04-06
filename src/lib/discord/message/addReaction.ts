import { Message } from "eris";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { retryOperation } from "../Retry";
import { StatsD } from "../../StatsD";

export async function addReaction(
  message: Message,
  reaction: string
): Promise<void> {
  StatsD.increment(`zephyr.message.add_reaction`, 1)
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
