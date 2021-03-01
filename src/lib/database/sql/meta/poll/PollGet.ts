import { DB, DBClass } from "../../..";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameProfile } from "../../../../../structures/game/Profile";
import {
  Answer,
  GameAnswer,
  GamePoll,
  Poll,
} from "../../../../../structures/poll/Poll";

export abstract class PollGet extends DBClass {
  public static async getPollById(id: number): Promise<GamePoll> {
    const query = (await DB.query(`SELECT * FROM poll WHERE id=?;`, [
      id,
    ])) as Poll[];

    if (!query[0]) throw new ZephyrError.PollDoesNotExistError(id);

    return new GamePoll(query[0]);
  }

  public static async getActivePolls(): Promise<GamePoll[]> {
    const query = (await DB.query(
      `SELECT * FROM poll WHERE active=1 AND CURRENT_TIMESTAMP < ends_at;`
    )) as Poll[];

    return query.map((p) => new GamePoll(p));
  }

  public static async userAnsweredPoll(
    poll: GamePoll,
    profile: GameProfile
  ): Promise<boolean> {
    const query = (await DB.query(
      `SELECT * FROM poll_answer WHERE poll_id=? AND discord_id=?;`,
      [poll.id, profile.discordId]
    )) as Answer[];

    return !!query[0];
  }

  public static async getAnswerById(id: number): Promise<GameAnswer> {
    const query = (await DB.query(`SELECT * FROM poll_answer WHERE id=?;`, [
      id,
    ])) as Answer[];

    if (!query[0]) throw new ZephyrError.PollAnswerDoesNotExistError();

    return new GameAnswer(query[0]);
  }

  public static async getPollStandings(
    poll: GamePoll
  ): Promise<{ yes: number; no: number }> {
    const query = (await DB.query(
      `SELECT IFNULL(SUM(answer="yes"), 0) AS yes, IFNULL(SUM(answer="no"), 0) AS no FROM poll_answer WHERE poll_id=?;`,
      [poll.id]
    )) as { yes: number; no: number }[];

    return query[0];
  }
}
