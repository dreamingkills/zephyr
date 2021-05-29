import { DB } from "../../..";
import {
  DBClub,
  GameDBClub,
} from "../../../../../structures/game/club/database/DBClub";
import {
  DBClubMember,
  GameDBClubMember,
} from "../../../../../structures/game/club/database/DBClubMember";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function getClubById(id: number): Promise<GameDBClub> {
  const query = (await DB.query(
    `
    SELECT
        club.id,
        club.club_name,
        club.blurb,
        club.owner_id,
        club.member_limit,
        club.vanity_code,
        club.club_open
    FROM
        club
    WHERE
        club.id = ?;
    `,
    [id]
  )) as DBClub[];

  if (!query[0]) throw "";

  return new GameDBClub(query[0]);
}

export async function getClubByName(
  name: string
): Promise<GameDBClub | undefined> {
  const query = (await DB.query(
    `
    SELECT
        club.id,
        club.club_name,
        club.blurb,
        club.owner_id,
        club.member_limit,
        club.vanity_code,
        club.club_open
    FROM
        club
    WHERE
        club.club_name LIKE ?;
    `,
    [name]
  )) as DBClub[];

  if (!query[0]) return;

  return new GameDBClub(query[0]);
}

export async function getClubsByOwner(
  profile: GameProfile
): Promise<GameDBClub[]> {
  const query = (await DB.query(
    `
    SELECT
        club.id,
        club.club_name,
        club.blurb,
        club.owner_id,
        club.member_limit
        club.vanity_code,
        club.club_open
    FROM
        club
    WHERE
        club.owner_id = ?;
    `,
    [profile.discordId]
  )) as DBClub[];

  return query.map((club) => new GameDBClub(club));
}

export async function getClubByVanityCode(code: string): Promise<GameDBClub> {
  const query = (await DB.query(
    `
    SELECT
        club.id,
        club.club_name,
        club.blurb,
        club.owner_id,
        club.member_limit,
        club.vanity_code,
        club.club_open
    FROM
        club
    WHERE
        club.vanity_code = ?;
    `,
    [code]
  )) as DBClub[];

  if (!query[0]) throw "";

  return new GameDBClub(query[0]);
}

/*
    Membership
*/

export async function getClubMembers(
  club: GameDBClub
): Promise<GameDBClubMember[]> {
  const query = (await DB.query(
    `
    SELECT
        club_member.id,
        club_member.discord_id,
        club_member.club_id,
        club_member.is_moderator
    FROM
        club_member
    WHERE
        club_member.club_id = ?;
    `,
    [club.id]
  )) as DBClubMember[];

  return query.map((clubMember) => new GameDBClubMember(clubMember));
}

export async function getClubMemberById(id: number): Promise<GameDBClubMember> {
  const query = (await DB.query(
    `
    SELECT
      club_member.id,
      club_member.discord_id,
      club_member.club_id,
      club_member.is_moderator
    FROM
      club_member
    WHERE
      club_member.id = ?;
    `,
    [id]
  )) as DBClubMember[];

  return query.map((clubMember) => new GameDBClubMember(clubMember))[0];
}

export async function getUserClubMembership(
  profile: GameProfile
): Promise<GameDBClub[]> {
  const query = (await DB.query(
    `
    SELECT
        club.id,
        club.club_name,
        club.blurb,
        club.owner_id,
        club.member_limit,
        club.vanity_code,
        club.club_open
    FROM
        club
    LEFT JOIN
        club_member
    ON
        club_member.club_id = club.id
    WHERE
        club_member.discord_id = ?;
    `,
    [profile.discordId]
  )) as DBClub[];

  return query.map((club) => new GameDBClub(club));
}

export async function isIllegalClubName(name: string): Promise<boolean> {
  const query = (await DB.query(
    `
    SELECT
        club_name
    FROM
        illegal_club_name
    WHERE
        club_name LIKE ?;
    `,
    [name]
  )) as { club_name: string }[];

  return !!query[0];
}
