import { Message } from "eris";
import { PollService } from "../../../lib/database/services/meta/PollService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameProfile } from "../../../structures/game/Profile";

export default class ActivatePoll extends BaseCommand {
  names = ["activatepoll"];
  description = `Activates a poll.`;
  usage = [`$CMD$ <poll id>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const pollId = parseInt(options[0], 10);

    if (isNaN(pollId) || pollId < 1) throw new ZephyrError.InvalidPollIdError();

    const poll = await PollService.getPollById(pollId);

    if (poll.active) throw new ZephyrError.PollAlreadyActivatedError(poll);

    const _poll = await PollService.activatePoll(poll);

    const embed = new MessageEmbed(`Activate Poll`, msg.author).setDescription(
      `Poll **${_poll.title}** has been activated.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
