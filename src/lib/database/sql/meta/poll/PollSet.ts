import { DB } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameAnswer, GamePoll } from "../../../../../structures/poll/Poll";
import { PollService } from "../../../services/meta/PollService";

export async function createPoll(
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
    query = (await DB.query(`INSERT INTO poll (title, body) VALUES (?, ?);`, [
      title,
      body,
    ])) as { insertId: number };

  return await PollService.getPollById(query.insertId);
}

export async function activatePoll(poll: GamePoll): Promise<GamePoll> {
  await DB.query(`UPDATE poll SET active=1 WHERE id=?;`, [poll.id]);

  return await poll.fetch();
}

export async function deactivatePoll(poll: GamePoll): Promise<GamePoll> {
  await DB.query(`UPDATE poll SET active=0 WHERE id=?;`, [poll.id]);

  return await poll.fetch();
}

export async function deletePoll(poll: GamePoll): Promise<void> {
  await DB.query(`DELETE FROM poll WHERE id=?;`, [poll.id]);

  return;
}

export async function answerPoll(
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

export * as PollSet from "./PollSet";
