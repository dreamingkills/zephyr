import { Message, TextableChannel } from "eris";
import { ErisFile } from "../../../structures/client/File";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { isFile } from "../../ZephyrUtils";

function deriveFileExtension(url: string): string {
  return url.split(".")[url.split(".").length - 1];
}

export async function createMessage(
  channel: TextableChannel,
  body: string | MessageEmbed | ErisFile,
  options?: { embed?: MessageEmbed; file?: ErisFile }
): Promise<Message<TextableChannel>> {
  let embed;
  let content;
  let file: { file: string | Buffer; name: string } | undefined;

  if (isFile(body)) {
    let fileName = body.name;

    if (!fileName) {
      fileName = `untitled-image.${deriveFileExtension(body.file)}`;
    }

    file = {
      file: body.file,
      name: fileName,
    };
  } else if (body instanceof MessageEmbed) {
    embed = body;
  } else content = body;

  if (options) {
    if (options.embed) {
      embed = options.embed;
    }
    if (options.file) {
      let fileName = options.file.name;

      if (!fileName) {
        fileName = `untitled-image.${deriveFileExtension(options.file.file)}`;
      }

      file = {
        file: options.file.file,
        name: fileName,
      };
    }
  }

  let message;

  let attempts = 0;
  while (attempts < 3 && !message) {
    try {
      attempts++;
      const sent = await channel.createMessage({ content, embed }, file);
      message = sent;
    } catch (e) {
      if (attempts === 3) {
        console.log(e);
      }
    }
  }

  if (!message) throw new ZephyrError.MessageFailedToSendError();
  return message;
}
