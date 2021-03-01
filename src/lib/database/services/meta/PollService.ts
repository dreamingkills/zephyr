import { GameProfile } from "../../../../structures/game/Profile";
import { GameAnswer, GamePoll } from "../../../../structures/poll/Poll";
import { PollGet } from "../../sql/meta/poll/PollGet";
import { PollSet } from "../../sql/meta/poll/PollSet";

export abstract class PollService {
  public static async createPoll(
    title: string,
    body: string,
    endsAt?: string
  ): Promise<GamePoll> {
    return await PollSet.createPoll(title, body, endsAt);
  }

  public static async getPollById(id: number): Promise<GamePoll> {
    return await PollGet.getPollById(id);
  }

  public static async activatePoll(poll: GamePoll): Promise<GamePoll> {
    return await PollSet.activatePoll(poll);
  }

  public static async deactivatePoll(poll: GamePoll): Promise<GamePoll> {
    return await PollSet.deactivatePoll(poll);
  }

  public static async getActivePolls(): Promise<GamePoll[]> {
    return await PollGet.getActivePolls();
  }

  public static async userAnsweredPoll(
    poll: GamePoll,
    profile: GameProfile
  ): Promise<boolean> {
    return await PollGet.userAnsweredPoll(poll, profile);
  }

  public static async getAnswerById(id: number): Promise<GameAnswer> {
    return await PollGet.getAnswerById(id);
  }

  public static async answerPoll(
    poll: GamePoll,
    profile: GameProfile,
    answer: `yes` | `no`
  ): Promise<GameAnswer> {
    return await PollSet.answerPoll(poll, profile, answer);
  }

  public static async getPollStandings(
    poll: GamePoll
  ): Promise<{ yes: number; no: number }> {
    return await PollGet.getPollStandings(poll);
  }
}
