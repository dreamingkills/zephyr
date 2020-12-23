export interface Patron {
  discord_id: string;
  next_frame_time: string | null;
}

export class GamePatron {
  discordId: string;
  nextFrameTime: string | null;
  constructor(data: Patron) {
    this.discordId = data.discord_id;
    this.nextFrameTime = data.next_frame_time;
  }
}
