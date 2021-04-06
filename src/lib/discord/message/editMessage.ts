import { Message, TextableChannel } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { retryOperation } from "../Retry";
import { StatsD } from "../../StatsD";

export async function editMessage(
  msg: Message,
  body: string | MessageEmbed,
  options?: { embed?: MessageEmbed }
): Promise<Message<TextableChannel>> {
  let embed: MessageEmbed;
  let content: string;

  if (body instanceof MessageEmbed) {
    embed = body;
  } else content = body;

  if (options) {
    if (options.embed) {
      embed = options.embed;
    }
  }

  let message: Message<TextableChannel>;

  StatsD.increment(`zephyr.message.edit`, 1)
  message = await retryOperation(
  async () => msg.edit({ content, embed }),
    10000,
    3
  ).catch((e) => {
    console.log(
      `Failed trying to edit message ${msg.id} with content ${content} in channel ${msg.channel.id}. Full stack:\n${e.stack}`
    );
    throw new ZephyrError.FailedToEditMessageError();
  });

  if (!message) throw new ZephyrError.FailedToEditMessageError();
  return message;
}
