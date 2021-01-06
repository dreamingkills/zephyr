import { Message, TextableChannel } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export async function editMessage(
  msg: Message,
  body: string | MessageEmbed,
  options?: { embed?: MessageEmbed }
): Promise<Message<TextableChannel>> {
  let embed;
  let content;

  if (body instanceof MessageEmbed) {
    embed = body;
  } else content = body;

  if (options) {
    if (options.embed) {
      embed = options.embed;
    }
  }

  let message;

  let attempts = 0;
  while (attempts < 3 && !message) {
    try {
      attempts++;
      const sent = await msg.edit({ content, embed });
      message = sent;
    } catch (e) {
      if (attempts === 3) {
        console.log(
          `Failed trying to edit message ${msg.id} with content ${content} in channel ${msg.channel.id}. Full stack:\n${e}`
        );
      }
    }
  }

  if (!message) throw new ZephyrError.MessageFailedToSendError();
  return message;
}
