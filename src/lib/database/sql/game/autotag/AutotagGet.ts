import { DB } from "../../..";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { Autotag, GameAutotag } from "../../../../../structures/game/Autotag";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function getAutotags(
  profile: GameProfile
): Promise<GameAutotag[]> {
  const query = (await DB.query(`SELECT * FROM autotag WHERE discord_id=?;`, [
    profile.discordId,
  ])) as Autotag[];

  return query.map((q) => new GameAutotag(q));
}

export async function getAutotagById(id: number): Promise<GameAutotag> {
  const query = (await DB.query(`SELECT * FROM autotag WHERE id=?;`, [
    id,
  ])) as Autotag[];

  if (!query[0]) throw new ZephyrError.AutotagIdNotFoundError(id);

  return new GameAutotag(query[0]);
}

export * as AutotagGet from "./AutotagGet";
