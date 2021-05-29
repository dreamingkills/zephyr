import { getClubMemberById } from "../../../../lib/database/sql/game/club/ClubGetter";

export interface DBClubMember {
  id: number;
  discord_id: string;
  club_id: number;
  is_moderator: boolean;
}

export class GameDBClubMember {
  id: number;
  discordId: string;
  clubId: number;
  isMod: boolean;

  constructor(clubMember: DBClubMember) {
    this.id = clubMember.id;
    this.discordId = clubMember.discord_id;
    this.clubId = clubMember.club_id;
    this.isMod = clubMember.is_moderator;
  }

  public async fetch() {
    return await getClubMemberById(this.id);
  }
}
