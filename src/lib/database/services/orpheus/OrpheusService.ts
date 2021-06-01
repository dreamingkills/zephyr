import { User } from "eris";
import { OrpheusBitTransaction } from "../../../../structures/orpheus/OrpheusBitTransaction";
import { OrpheusClaim } from "../../../../structures/orpheus/OrpheusClaim";
import { OrpheusCommand } from "../../../../structures/orpheus/OrpheusCommand";
import { OrpheusGift } from "../../../../structures/orpheus/OrpheusGift";
import { OrpheusMultitrade } from "../../../../structures/orpheus/OrpheusMultitrade";
import { OrpheusTrade } from "../../../../structures/orpheus/OrpheusTrade";
import { OrpheusGet } from "../../sql/orpheus/OrpheusGet";

export async function getGifts(user: User): Promise<OrpheusGift[]> {
  return await OrpheusGet.getGifts(user);
}

export async function getGiftById(
  id: number
): Promise<OrpheusGift | undefined> {
  return await OrpheusGet.getGiftById(id);
}

export async function getGiftsReceived(user: User): Promise<OrpheusGift[]> {
  return await OrpheusGet.getGiftsReceived(user);
}

export async function getGiftsSent(user: User): Promise<OrpheusGift[]> {
  return await OrpheusGet.getGiftsSent(user);
}

export async function getTrades(user: User): Promise<OrpheusTrade[]> {
  return await OrpheusGet.getTrades(user);
}

export async function getMultitrades(user: User): Promise<OrpheusMultitrade[]> {
  return await OrpheusGet.getMultitrades(user);
}

export async function getClaims(user: User): Promise<OrpheusClaim[]> {
  return await OrpheusGet.getClaims(user);
}

export async function getDrops(user: User): Promise<OrpheusClaim[]> {
  return await OrpheusGet.getDrops(user);
}

export async function getCommandUses(user: User): Promise<OrpheusCommand[]> {
  return await OrpheusGet.getCommandUses(user);
}

export async function getBitTransactions(
  user: User
): Promise<OrpheusBitTransaction[]> {
  return await OrpheusGet.getBitTransactions(user);
}

export * as OrpheusService from "./OrpheusService";
