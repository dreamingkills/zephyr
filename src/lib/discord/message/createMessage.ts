import { Message, MessageFile, TextableChannel } from "eris";
import { ErisFile } from "../../../structures/client/ErisFile";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { retryOperation } from "../Retry";
import { StatsD } from "../../StatsD";

function deriveFileExtension(url: string | Buffer): string {
  if (url instanceof Buffer) {
    return "";
  } else return url.split(".")[url.split(".").length - 1];
}

export async function createMessage(
  channel: TextableChannel,
  body: string | MessageEmbed,
  options?: { embed?: MessageEmbed; files?: ErisFile[] }
): Promise<Message<TextableChannel>> {
  let embed: MessageEmbed | undefined;
  let content: string;

  if (body instanceof MessageEmbed) {
    embed = body;
  } else content = body;

  let derivedFiles: MessageFile[] = [];

  if (options) {
    if (options.embed) {
      embed = options.embed;
    }
    if (options.files) {
      for (let file of options.files) {
        let fileName = file.name;

        if (!fileName)
          fileName = `untitled-image.${deriveFileExtension(file.file)}`;

        derivedFiles.push({ file: file.file, name: fileName });
      }
    }
  }

  let message;

  StatsD.increment(`zephyr.message.create`, 1)
  message = await retryOperation(
    async () => channel.createMessage({ content, embed }, derivedFiles),
    10000,
    3
  ).catch((e) => {
    if (!e?.stack.includes(`[50013]:`)) {
      if (channel.type !== 1) {
        console.log(
          `Failed trying to send message with content ${content} (embed content: ${embed?.description}) in channel ${channel.id}. Full stack:\n${e.stack}`
        );
      }
    }

    throw new ZephyrError.MessageFailedToSendError();
  });

  return message;
}
