import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface DBProfile {
  discord_id: string;
}
export interface Profile {
  discordId: string;
}
export class GameProfile implements Profile {
  discordId: string;
  constructor(data: DBProfile) {
    this.discordId = data.discord_id;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }
}

/*
CREATE TABLE profile
(
    id              INT(11) AUTO_INCREMENT,
    discord_id      TINYTEXT NOT NULL,
    PRIMARY KEY(id)
);
*/
