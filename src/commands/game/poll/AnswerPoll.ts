import dayjs from "dayjs";
import { Message } from "eris";
import { PollService } from "../../../lib/database/services/meta/PollService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameProfile } from "../../../structures/game/Profile";

export default class AnswerPoll extends BaseCommand {
  id = `butane`;
  names = [`answer`];
  description = `Answers a poll if it's active.`;
  usage = [`$CMD$ <poll number> <yes/no>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const pollId = parseInt(options[0]);
    if (!pollId || pollId < 1) throw new ZephyrError.InvalidPollIdError();

    const poll = await PollService.getPollById(pollId);

    if (poll.endsAt) {
      const now = dayjs();
      const end = dayjs(poll.endsAt);

      if (now >= end) throw new ZephyrError.PollInactiveError(poll);
    }

    if (!poll.active) throw new ZephyrError.PollInactiveError(poll);

    const answered = await PollService.userAnsweredPoll(poll, profile);
    if (answered) throw new ZephyrError.PollAnsweredError(poll);

    const answer = options[1]?.toLowerCase();

    if (![`yes`, `no`].includes(answer))
      throw new ZephyrError.InvalidPollAnswerError();

    await PollService.answerPoll(poll, profile, answer as `yes` | `no`);

    const embed = new MessageEmbed(`Answer Poll`, msg.author)
      .setTitle(`Poll #${poll.id}: ${poll.title}`)
      .setDescription(
        `You voted **${answer}** on this poll. Thanks for voting!`
      );
    await this.send(msg.channel, embed);

    return;
  }
}
