import { PollService } from "../../lib/database/services/meta/PollService";

export interface Poll {
  id: number;
  active: boolean;
  title: string;
  body: string;
  created_at: string;
  ends_at: string | null;
}

export interface Answer {
  id: number;
  poll_id: number;
  discord_id: string;
  answer: `yes` | `no`;
  created_at: string;
}

export class GamePoll {
  id: number;
  active: boolean;
  title: string;
  body: string;

  createdAt: string;
  endsAt: string | undefined;
  constructor(poll: Poll) {
    this.id = poll.id;
    this.active = poll.active;
    this.title = poll.title;
    this.body = poll.body;

    this.createdAt = poll.created_at;
    this.endsAt = poll.ends_at || undefined;
  }

  public async fetch(): Promise<GamePoll> {
    return await PollService.getPollById(this.id);
  }
}

export class GameAnswer {
  id: number;
  pollId: number;
  discordId: string;
  answer: `yes` | `no`;
  createdAt: string;
  constructor(answer: Answer) {
    this.id = answer.id;
    this.pollId = answer.poll_id;
    this.discordId = answer.discord_id;
    this.answer = answer.answer;
    this.createdAt = answer.created_at;
  }
}
