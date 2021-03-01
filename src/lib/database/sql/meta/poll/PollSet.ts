import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameAnswer, GamePoll } from "../../../../../structures/poll/Poll";
import { PollService } from "../../../services/meta/PollService";

export abstract class PollSet extends DBClass {
  public static async createPoll(
    title: string,
    body: string,
    endsAt?: string
  ): Promise<GamePoll> {
    let query;

    if (endsAt) {
      query = (await DB.query(
        `INSERT INTO poll (title, body, ends_at) VALUES (?, ?, ?);`,
        [title, body, endsAt]
      )) as { insertId: number };
    } else
      query = (await DB.query(`INSERT INTO POLL (title, body) VALUES (?, ?);`, [
        title,
        body,
      ])) as { insertId: number };

    return await PollService.getPollById(query.insertId);
  }

  public static async activatePoll(poll: GamePoll): Promise<GamePoll> {
    await DB.query(`UPDATE poll SET active=1 WHERE id=?;`, [poll.id]);

    return await poll.fetch();
  }

  public static async deactivatePoll(poll: GamePoll): Promise<GamePoll> {
    await DB.query(`UPDATE poll SET active=0 WHERE id=?;`, [poll.id]);

    return await poll.fetch();
  }

  public static async deletePoll(poll: GamePoll): Promise<void> {
    await DB.query(`DELETE FROM poll WHERE id=?;`, [poll.id]);

    return;
  }

  public static async answerPoll(
    poll: GamePoll,
    profile: GameProfile,
    answer: `yes` | `no`
  ): Promise<GameAnswer> {
    const query = (await DB.query(
      `INSERT INTO poll_answer (poll_id, discord_id, answer) VALUES (?, ?, ?);`,
      [poll.id, profile.discordId, answer]
    )) as { insertId: number };

    return await PollService.getAnswerById(query.insertId);
  }
}
