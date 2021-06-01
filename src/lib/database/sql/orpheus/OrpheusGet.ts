import { User } from "eris";
import { DB } from "../..";
import { OrpheusBitTransaction } from "../../../../structures/orpheus/OrpheusBitTransaction";
import { OrpheusClaim } from "../../../../structures/orpheus/OrpheusClaim";
import { OrpheusCommand } from "../../../../structures/orpheus/OrpheusCommand";
import { OrpheusGift } from "../../../../structures/orpheus/OrpheusGift";
import { OrpheusMultitrade } from "../../../../structures/orpheus/OrpheusMultitrade";
import { OrpheusTrade } from "../../../../structures/orpheus/OrpheusTrade";

export async function getGifts(user: User): Promise<OrpheusGift[]> {
  const query = (await DB.query(
    `SELECT * FROM gift WHERE (recipient=?) OR (giver=?);`,
    [user.id, user.id]
  )) as OrpheusGift[];

  return query;
}

export async function getGiftById(
  id: number
): Promise<OrpheusGift | undefined> {
  const query = (await DB.query(`SELECT * FROM gift WHERE id=?;`, [id])) as (
    | OrpheusGift
    | undefined
  )[];

  return query[0];
}

export async function getGiftsReceived(user: User): Promise<OrpheusGift[]> {
  const query = (await DB.query(`SELECT * FROM gift WHERE recipient=?;`, [
    user.id,
  ])) as OrpheusGift[];

  return query;
}

export async function getGiftsSent(user: User): Promise<OrpheusGift[]> {
  const query = (await DB.query(`SELECT * FROM gift WHERE giver=?;`, [
    user.id,
  ])) as OrpheusGift[];

  return query;
}

export async function getTrades(user: User): Promise<OrpheusTrade[]> {
  const query = (await DB.query(
    `SELECT * FROM trade WHERE sender=? OR receiver=?;`,
    [user.id, user.id]
  )) as OrpheusTrade[];

  return query;
}

export async function getMultitrades(user: User): Promise<OrpheusMultitrade[]> {
  const query = (await DB.query(
    `SELECT * FROM multitrade WHERE sender=? OR receiver=?;`,
    [user.id, user.id]
  )) as OrpheusMultitrade[];

  return query;
}

export async function getClaims(user: User): Promise<OrpheusClaim[]> {
  const query = (await DB.query(`SELECT * FROM claim WHERE claimer=?;`, [
    user.id,
  ])) as OrpheusClaim[];

  return query;
}

export async function getDrops(user: User): Promise<OrpheusClaim[]> {
  const query = (await DB.query(`SELECT * FROM claim WHERE dropper=?;`, [
    user.id,
  ])) as OrpheusClaim[];

  return query;
}

export async function getCommandUses(user: User): Promise<OrpheusCommand[]> {
  const query = (await DB.query(
    `SELECT * FROM command_use WHERE discord_id=?;`,
    [user.id]
  )) as OrpheusCommand[];

  return query;
}

export async function getBitTransactions(
  user: User
): Promise<OrpheusBitTransaction[]> {
  const query = (await DB.query(
    `SELECT * FROM bit_transaction WHERE giver=? OR recipient=?;`,
    [user.id, user.id]
  )) as OrpheusBitTransaction[];

  return query;
}

export * as OrpheusGet from "./OrpheusGet";
