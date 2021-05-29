import { getClubById } from "../../../../lib/database/sql/game/club/ClubGetter";

export interface DBClub {
  id: number;
  club_name: string;
  blurb: string | null;
  owner_id: string;
  member_limit: number;
  vanity_code: string | null;
  club_open: boolean;
}

export class GameDBClub {
  id: number;
  name: string;
  blurb: string | undefined;
  ownerId: string;
  memberLimit: number;
  vanityCode: string | undefined;
  open: boolean;

  constructor(club: DBClub) {
    this.id = club.id;
    this.name = club.club_name;
    this.blurb = club.blurb || undefined;
    this.ownerId = club.owner_id;
    this.memberLimit = club.member_limit;
    this.vanityCode = club.vanity_code || undefined;
    this.open = club.club_open;
  }

  public async fetch(): Promise<GameDBClub> {
    return await getClubById(this.id);
  }
}
