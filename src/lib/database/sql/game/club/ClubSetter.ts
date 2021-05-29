import { DB } from "../../..";
import { GameDBClub } from "../../../../../structures/game/club/database/DBClub";
import { GameDBClubMember } from "../../../../../structures/game/club/database/DBClubMember";
import { GameProfile } from "../../../../../structures/game/Profile";
import { getClubById } from "./ClubGetter";

export async function createClub(
  creator: GameProfile,
  name: string
): Promise<GameDBClub> {
  const query = (await DB.query(
    `
    INSERT INTO club 
        (club_name, owner_id)
    VALUES
        (?, ?);
    `,
    [name, creator.discordId]
  )) as { insertId: number };

  return await getClubById(query.insertId);
}

export async function setClubOwner(
  club: GameDBClub,
  newOwner: GameProfile
): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.owner_id = ?
    WHERE
        club.id = ?;
    `,
    [newOwner.discordId, club.id]
  );

  return await club.fetch();
}

export async function setClubBlurb(
  club: GameDBClub,
  blurb: string
): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.blurb = ?
    WHERE
        club.id = ?;
    `,
    [blurb, club.id]
  );

  return await club.fetch();
}

export async function setClubMemberLimit(
  club: GameDBClub,
  newLimit: number
): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.member_limit = ?
    WHERE
        club.id = ?;   
    `,
    [newLimit, club.id]
  );

  return await club.fetch();
}

export async function setClubVanityCode(
  club: GameDBClub,
  code: string
): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.vanity_code = ?
    WHERE
        club.id = ?;
    `,
    [code, club.id]
  );

  return await club.fetch();
}

export async function setClubOpen(club: GameDBClub): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.club_open = 1
    WHERE
        club.id = ?;
    `,
    [club.id]
  );

  return await club.fetch();
}

export async function setClubClosed(club: GameDBClub): Promise<GameDBClub> {
  await DB.query(
    `
    UPDATE
        club
    SET
        club.club_open = 0
    WHERE
        club.id = ?;
    `,
    [club.id]
  );

  return await club.fetch();
}

export async function deleteClub(club: GameDBClub): Promise<void> {
  await DB.query(
    `
    DELETE FROM
        club
    WHERE
        club.id = ?;
    `,
    [club.id]
  );

  await DB.query(
    `
    DELETE FROM
        club_member
    WHERE
        club_member.club_id = ?;
    `,
    [club.id]
  );

  return;
}
/*
    Membership
*/

export async function addUserToClub(
  club: GameDBClub,
  profile: GameProfile
): Promise<void> {
  await DB.query(
    `
    INSERT INTO
        club_member (discord_id, club_id)
    VALUES
        (?, ?);
    `,
    [profile.discordId, club.id]
  );

  return;
}

export async function kickUserFromClub(
  clubMember: GameDBClubMember
): Promise<void> {
  await DB.query(
    `
    DELETE FROM
        club_member
    WHERE
        id = ?;
    `,
    [clubMember.id]
  );

  return;
}

export async function addIllegalClubName(name: string): Promise<void> {
  await DB.query(
    `
    INSERT INTO
        illegal_club_name (club_name)
    VALUES
        ?;
    `,
    [name]
  );

  return;
}

export async function deleteIllegalClubName(name: string): Promise<void> {
  await DB.query(
    `
    DELETE FROM
        illegal_club_name
    WHERE
        club_name LIKE ?;
    `,
    [name]
  );

  return;
}

export async function setClubModerator(
  member: GameDBClubMember,
  club: GameDBClub
): Promise<GameDBClubMember> {
  await DB.query(
    `
    UPDATE
      club_member
    SET
      is_moderator = 1
    WHERE
      discord_id = ?
    AND
      club_id = ?;
    `,
    [member.discordId, club.id]
  );

  return await member.fetch();
}

export async function unsetClubModerator(
  member: GameDBClubMember,
  club: GameDBClub
): Promise<GameDBClubMember> {
  await DB.query(
    `
  UPDATE
      club_member
  SET
      is_moderator = 0
  WHERE
      discord_id = ?
  AND
      club_id = ?;
  `,
    [member.discordId, club.id]
  );

  return await member.fetch();
}
