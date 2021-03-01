import dayjs from "dayjs";
import { Message } from "eris";
import { PollService } from "../../../lib/database/services/meta/PollService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameProfile } from "../../../structures/game/Profile";

export default class CreatePoll extends BaseCommand {
  names = ["createpoll"];
  description = `Creates a new poll.`;
  usage = [`$CMD$ <poll title || poll description> [|| poll end time]`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const [title, description, end] = options
      .join(` `)
      .split(`||`)
      .map((o) => o.trim());

    if (!title) throw new ZephyrError.InvalidPollTitleError();
    if (!description) throw new ZephyrError.InvalidPollDescriptionError();

    let endsAt;
    if (end) {
      const time = dayjs(end).format(`YYYY-MM-DD HH:mm:ss`);

      if (time !== `Invalid Date`) endsAt = time;
    }

    const poll = await PollService.createPoll(title, description, endsAt);

    const embed = new MessageEmbed(`Create Poll`, msg.author)
      .setDescription(
        `Created a new poll titled **${title}**.\nHas End?: **${
          endsAt || `No`
        }**\nDescription:\n${description}`
      )
      .setFooter(`Poll ID: ${poll.id} - Don't forget to activate!`);

    await this.send(msg.channel, embed);
    return;
  }
}
