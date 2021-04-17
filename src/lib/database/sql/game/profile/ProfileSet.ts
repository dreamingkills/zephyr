import { DB } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameDye } from "../../../../../structures/game/Dye";
import {
  getNearestColor,
  rgbToHex,
} from "../../../../utility/color/ColorUtils";
import dayjs from "dayjs";
import { PrefabItem } from "../../../../../structures/item/PrefabItem";
import { GameTag } from "../../../../../structures/game/Tag";
import { VaultError } from "../../../../../structures/error/VaultError";

/*
      Profile
  */
export async function createNewProfile(
  discordId: string
): Promise<GameProfile> {
  await DB.query(`INSERT INTO profile (discord_id) VALUES (?);`, [discordId]);
  return await ProfileService.getProfile(discordId);
}

export async function togglePrivateProfile(discordId: string): Promise<void> {
  await DB.query(`UPDATE profile SET private=1-private WHERE discord_id=?;`, [
    discordId,
  ]);
  return;
}

export async function setBlurb(
  discordId: string,
  blurb: string
): Promise<void> {
  await DB.query(`UPDATE profile SET blurb=? WHERE discord_id=?;`, [
    blurb,
    discordId,
  ]);
  return;
}

export async function addToWishlist(
  discordId: string,
  idolId: number
): Promise<void> {
  await DB.query(`INSERT INTO wishlist (discord_id, idol_id) VALUES (?, ?);`, [
    discordId,
    idolId,
  ]);

  return;
}

export async function removeFromWishlist(
  discordId: string,
  idolId: number
): Promise<void> {
  await DB.query(`DELETE FROM wishlist WHERE discord_id=? AND idol_id=?;`, [
    discordId,
    idolId,
  ]);
  return;
}

export async function clearWishlist(discordId: string): Promise<void> {
  await DB.query(`DELETE FROM wishlist WHERE discord_id=?;`, [discordId]);
  return;
}

/*
      Currency
  */
export async function addBits(
  profile: GameProfile,
  amount: number
): Promise<void> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.bits + amount > 4294967295)
    throw new ZephyrError.TooManyError();

  await DB.query(`UPDATE profile SET bits=bits+? WHERE discord_id=?;`, [
    amount,
    profile.discordId,
  ]);
  return;
}

export async function removeBits(
  profile: GameProfile,
  amount: number
): Promise<void> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.bits - amount < 0)
    throw new ZephyrError.NotEnoughBitsError(amount);

  await DB.query(`UPDATE profile SET bits=bits-? WHERE discord_id=?;`, [
    amount,
    profile.discordId,
  ]);
  return;
}

export async function addBitsToVault(
  profile: GameProfile,
  amount: number
): Promise<GameProfile> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.bits - amount < 0)
    throw new ZephyrError.NotEnoughBitsError(amount);

  await DB.query(
    `
      UPDATE
        profile
      SET
        bits=bits-?,
        bits_vault=bits_vault+?
      WHERE
        discord_id=?;`,
    [amount, amount, profile.discordId]
  );

  return await profile.fetch();
}

export async function removeBitsFromVault(
  profile: GameProfile,
  amount: number,
  prefix: string
): Promise<GameProfile> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.bitsVault - amount < 0)
    throw new VaultError.NotEnoughBitsInVaultError(prefix);

  await DB.query(
    `
      UPDATE
        profile
      SET
        bits=bits+?,
        bits_vault=bits_vault-?
      WHERE
        discord_id=?;`,
    [amount, amount, profile.discordId]
  );

  return await profile.fetch();
}

export async function addCubitsToVault(
  profile: GameProfile,
  amount: number
): Promise<GameProfile> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.cubits - amount < 0)
    throw new ZephyrError.NotEnoughCubitsError(profile.cubits, amount);

  await DB.query(
    `
      UPDATE
        profile
      SET
        cubits=cubits-?,
        cubits_vault=cubits_vault+?
      WHERE
        discord_id=?;`,
    [amount, amount, profile.discordId]
  );

  return await profile.fetch();
}

export async function removeCubitsFromVault(
  profile: GameProfile,
  amount: number,
  prefix: string
): Promise<GameProfile> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.cubitsVault - amount < 0)
    throw new VaultError.NotEnoughCubitsInVaultError(prefix);

  await DB.query(
    `
      UPDATE
        profile
      SET
        cubits=cubits+?,
        cubits_vault=cubits_vault-?
      WHERE
        discord_id=?;`,
    [amount, amount, profile.discordId]
  );

  return await profile.fetch();
}

/*
      Timers
  */
export async function setDailyTimestamp(
  discordId: string,
  timestamp: string
): Promise<void> {
  await DB.query(`UPDATE profile SET daily_last=? WHERE discord_id=?;`, [
    timestamp,
    discordId,
  ]);
  return;
}

export async function incrementDailyStreak(discordId: string): Promise<void> {
  await DB.query(
    `UPDATE profile SET daily_streak=daily_streak+1 WHERE discord_id=?;`,
    [discordId]
  );
  return;
}

export async function resetDailyStreak(discordId: string): Promise<void> {
  await DB.query(`UPDATE profile SET daily_streak=1 WHERE discord_id=?;`, [
    discordId,
  ]);
  return;
}

export async function setDropTimestamp(
  discordId: string,
  timestamp: string
): Promise<void> {
  await DB.query(
    `UPDATE profile SET drop_next=?,drop_reminded=0 WHERE discord_id=?;`,
    [timestamp, discordId]
  );
}

export async function setClaimTimestamp(
  discordId: string,
  timestamp: string
): Promise<void> {
  await DB.query(
    `UPDATE profile SET claim_next=?,claim_reminded=0 WHERE discord_id=?;`,
    [timestamp, discordId]
  );
}

/*
      Items
  */
export async function addItems(
  discordId: string,
  items: { item: PrefabItem; count: number }[]
): Promise<void> {
  for (let item of items) {
    await DB.query(
      `INSERT INTO user_item (discord_id, item_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity=quantity+?;`,
      [discordId, item.item.id, item.count, item.count]
    );
  }
  return;
}

export async function removeItems(
  profile: GameProfile,
  items: { item: PrefabItem; count: number }[]
): Promise<void> {
  const refetched = [];
  for (let item of items) {
    const refetchItem = await ProfileService.getItem(
      profile,
      item.item.id,
      item.item.names[0]
    );

    if (refetchItem.quantity - item.count < 0)
      throw new ZephyrError.NotEnoughOfItemError(item.item.names[0]);

    refetched.push(item);
  }
  for (let item of refetched) {
    await DB.query(
      `UPDATE user_item SET quantity=quantity-? WHERE item_id=? AND discord_id=?;`,
      [item.count, item.item.id, profile.discordId]
    );
  }
  return;
}

/*
      Tags
  */
export async function createTag(
  discordId: string,
  name: string,
  emoji: string
): Promise<GameTag> {
  const query = (await DB.query(
    `INSERT INTO card_tag (discord_id, tag_name, emoji) VALUES (?, ?, ?);`,
    [discordId, name, emoji]
  )) as { insertId: number };

  return await ProfileService.getTagById(query.insertId);
}

export async function deleteTag(tagId: number): Promise<void> {
  await DB.query(`DELETE FROM card_tag WHERE id=?;`, [tagId]);
  await DB.query(`UPDATE user_card SET tag_id=NULL WHERE tag_id=?;`, [tagId]);

  return;
}

export async function editTag(
  tag: GameTag,
  name?: string,
  emoji?: string
): Promise<GameTag> {
  if (!name && emoji) {
    await DB.query(`UPDATE card_tag SET emoji=? WHERE id=?;`, [emoji, tag.id]);
  } else if (!emoji && name) {
    await DB.query(`UPDATE card_tag SET tag_name=? WHERE id=?;`, [
      name,
      tag.id,
    ]);
  } else if (emoji && name) {
    await DB.query(`UPDATE card_tag SET tag_name=?, emoji=? WHERE id=?;`, [
      name,
      emoji,
      tag.id,
    ]);
  } else throw new ZephyrError.NoParametersInTagEditError();

  return await tag.fetch();
}

export async function toggleDropReminders(discordId: string[]): Promise<void> {
  await DB.query(
    `UPDATE profile SET drop_reminder=1-drop_reminder WHERE discord_id IN (?);`,
    [discordId]
  );
  return;
}

export async function toggleClaimReminders(discordId: string[]): Promise<void> {
  await DB.query(
    `UPDATE profile SET claim_reminder=1-claim_reminder WHERE discord_id IN (?);`,
    [discordId]
  );
  return;
}

export async function toggleVoteReminders(discordId: string[]): Promise<void> {
  await DB.query(
    `UPDATE profile SET vote_reminder=1-vote_reminder WHERE discord_id IN (?);`,
    [discordId]
  );
  return;
}

export async function disableReminders(discordId: string[]): Promise<void> {
  await DB.query(
    `UPDATE profile SET claim_reminder=0,drop_reminder=0,vote_reminder=0 WHERE discord_id IN (?);`,
    [discordId]
  );
  return;
}

export async function setUserClaimReminded(
  profiles: GameProfile[]
): Promise<void> {
  await DB.query(
    `UPDATE profile SET claim_reminded=1 WHERE discord_id IN (?);`,
    [profiles.map((p) => p.discordId)]
  );
  return;
}

export async function setUserDropReminded(
  profiles: GameProfile[]
): Promise<void> {
  await DB.query(
    `UPDATE profile SET drop_reminded=1 WHERE discord_id IN (?);`,
    [profiles.map((p) => p.discordId)]
  );
  return;
}

export async function setUserVoteReminded(
  profiles: GameProfile[]
): Promise<void> {
  await DB.query(
    `UPDATE profile SET vote_reminded=1 WHERE discord_id IN (?);`,
    [profiles.map((p) => p.discordId)]
  );
  return;
}

export async function addDye(
  discordId: string,
  color: { r: number; g: number; b: number }
): Promise<GameDye> {
  const dyeName = getNearestColor(rgbToHex(color.r, color.g, color.b)).name;
  const query = (await DB.query(
    `INSERT INTO dye (discord_id, name, dye_r, dye_g, dye_b, charges) VALUES (?, ?, ?, ?, ?, 1);`,
    [discordId, dyeName, color.r, color.g, color.b]
  )) as { insertId: number };

  return await ProfileService.getDyeById(query.insertId);
}

export async function addChargesToDye(
  id: number,
  amount: number
): Promise<void> {
  await DB.query(`UPDATE dye SET charges=charges+? WHERE id=?;`, [amount, id]);

  return;
}

export async function removeChargesFromDye(
  id: number,
  amount: number
): Promise<void> {
  await DB.query(`UPDATE dye SET charges=charges-? WHERE id=?;`, [amount, id]);

  return;
}

export async function burnDyes(dyes: GameDye[]): Promise<void> {
  await DB.query(`DELETE FROM dye WHERE id IN (?);`, [dyes.map((d) => d.id)]);

  return;
}

export async function transferDyesToUser(
  dyes: GameDye[],
  profile: GameProfile
): Promise<void> {
  await DB.query(`UPDATE dye SET discord_id=? WHERE id IN (?);`, [
    profile.discordId,
    dyes.map((i) => i.id),
  ]);

  return;
}

export async function setPatronTier(
  profile: GameProfile,
  tier: number
): Promise<void> {
  await DB.query(`UPDATE profile SET patron=? WHERE discord_id=?;`, [
    tier,
    profile.discordId,
  ]);
  return;
}

export async function blacklistUser(
  profile: GameProfile
): Promise<GameProfile> {
  await DB.query(`UPDATE profile SET blacklisted=1 WHERE discord_id=?;`, [
    profile.discordId,
  ]);

  return await profile.fetch();
}

export async function unblacklistUser(
  profile: GameProfile
): Promise<GameProfile> {
  await DB.query(`UPDATE profile SET blacklisted=0 WHERE discord_id=?;`, [
    profile.discordId,
  ]);

  return await profile.fetch();
}

export async function addVote(
  profile: GameProfile,
  isWeekend: boolean
): Promise<void> {
  const formattedTimestamp = dayjs().format(`YYYY/MM/DD HH:mm:ss`);

  await DB.query(
    `UPDATE profile SET cubits=cubits+?, vote_last=?, vote_reminded=0 WHERE discord_id=?;`,
    [isWeekend ? 4 : 2, formattedTimestamp, profile.discordId]
  );
  return;
}

export async function addCubits(
  profile: GameProfile,
  amount: number
): Promise<void> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.cubits + amount > 4294967295)
    throw new ZephyrError.TooManyError();

  await DB.query(`UPDATE profile SET cubits=cubits+? WHERE discord_id=?;`, [
    amount,
    profile.discordId,
  ]);

  return;
}

export async function removeCubits(
  profile: GameProfile,
  amount: number
): Promise<void> {
  const refetchProfile = await profile.fetch();

  if (refetchProfile.cubits - amount < 0)
    throw new ZephyrError.NotEnoughCubitsError(refetchProfile.cubits, 0);

  await DB.query(`UPDATE profile SET cubits=cubits-? WHERE discord_id=?;`, [
    amount,
    profile.discordId,
  ]);

  return;
}

export async function setBooster(
  profile: GameProfile,
  groupId: number,
  expiry: string
): Promise<void> {
  await DB.query(
    `UPDATE profile SET booster_group=?, booster_expiry=? WHERE discord_id=?;`,
    [groupId, expiry, profile.discordId]
  );

  return;
}

export async function clearBooster(profile: GameProfile): Promise<void> {
  await DB.query(
    `UPDATE profile SET booster_group=NULL, booster_expiry=NULL WHERE discord_id=?;`,
    [profile.discordId]
  );

  return;
}

export async function setProfileCreationDate(
  profile: GameProfile,
  date: string
): Promise<void> {
  await DB.query(`UPDATE profile SET created_at=? WHERE discord_id=?;`, [
    date,
    profile.discordId,
  ]);

  return;
}

export * as ProfileSet from "./ProfileSet";
