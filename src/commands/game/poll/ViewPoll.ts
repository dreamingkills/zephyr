import dayjs from "dayjs";
import { Message } from "eris";
import { PollService } from "../../../lib/database/services/meta/PollService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ViewPoll extends BaseCommand {
  id = `xxok`;
  names = [`poll`];
  description = `Shows you the current active poll if there is one.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const polls = await PollService.getActivePolls();
    const poll = polls[0];

    if (!poll) {
      const embed = new MessageEmbed(`Poll`, msg.author).setDescription(
        `:confused: There are currently no active polls.\n\nCheck back later, or join [Zephyr Community](https://discord.gg/zephyr) to be notified when they open!`
      );

      await this.send(msg.channel, embed);
      return;
    }

    // const standings = await PollService.getPollStandings(poll);
    const userVoted = await PollService.userAnsweredPoll(poll, profile);

    let footer;
    if (poll.endsAt) {
      const timestamp = dayjs(poll.endsAt).format(`MMMM D, YYYY [at] HH:mm:ss`);
      footer = `This poll will end at ${timestamp} UTC.`;
    } else footer = `This poll has no end date set.`;

    const prefix = Zephyr.getPrefix(msg.guildID);
    const embed = new MessageEmbed(`Poll`, msg.author)
      .setTitle(`Poll #${poll.id}: ${poll.title}`)
      .setDescription(
        `${poll.body}\n\n${
          !userVoted
            ? `:ballot_box: To vote, use \`${prefix}answer ${poll.id} yes/no\`!`
            : `__You have already voted for this poll.__`
        }`
      )
      .setFooter(footer);

    await this.send(msg.channel, embed);
  }
}
