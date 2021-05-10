import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { Zephyr } from "../../structures/client/Zephyr";

export default class SimulateVote extends BaseCommand {
  names = [`simvote`];
  description = `Simulates a vote.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!msg.mentions[0]) {
      await this.send(
        msg.channel,
        `Please mention someone to force a vote on.`
      );
      return;
    }

    await Zephyr.handleVote(msg.mentions[0].id, options[0] === "true");

    await this.send(msg.channel, `Done`);
    return;
  }
}
