import { GameDye } from "../../../../structures/game/Dye";
import { GameItem } from "../../../../structures/game/Item";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameTag } from "../../../../structures/game/Tag";
import { GameWishlist } from "../../../../structures/game/Wishlist";
import { ProfileGet } from "../../sql/game/profile/ProfileGet";
import { ProfileSetter } from "../../sql/game/profile/ProfileSetter";
import { PrefabItem } from "../../../../structures/item/PrefabItem";
import { items } from "../../../../assets/Items";

export abstract class ProfileService {
  /*
      Profile
  */
  public static async getProfile(
    discordId: string | number,
    autoGenerate?: boolean
  ): Promise<GameProfile> {
    return await ProfileGet.getProfileByDiscordId(
      discordId as string,
      autoGenerate
    );
  }

  public static async createProfile(
    discordId: string | number
  ): Promise<GameProfile> {
    return await ProfileSetter.createNewProfile(discordId as string);
  }

  public static async togglePrivateProfile(
    profile: GameProfile
  ): Promise<GameProfile> {
    await ProfileSetter.togglePrivateProfile(profile.discordId);
    return await profile.fetch();
  }

  public static async setProfileBlurb(
    profile: GameProfile,
    blurb: string
  ): Promise<GameProfile> {
    await ProfileSetter.setBlurb(profile.discordId, blurb);
    return await profile.fetch();
  }

  public static async getWishlist(
    profile: GameProfile
  ): Promise<GameWishlist[]> {
    return await ProfileGet.getWishlist(profile.discordId);
  }

  public static async addToWishlist(
    profile: GameProfile,
    idolId: number
  ): Promise<void> {
    return await ProfileSetter.addToWishlist(profile.discordId, idolId);
  }

  public static async removeFromWishlist(
    profile: GameProfile,
    idolId: number
  ): Promise<void> {
    return await ProfileSetter.removeFromWishlist(profile.discordId, idolId);
  }

  public static async clearWishlist(profile: GameProfile): Promise<void> {
    return await ProfileSetter.clearWishlist(profile.discordId);
  }

  /*
      Currency
  */
  public static async addBitsToProfile(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.addBits(profile, amount);
    return await profile.fetch();
  }

  public static async removeBitsFromProfile(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.removeBits(profile, amount);
    return await profile.fetch();
  }

  public static async addBitsToVault(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.addBitsToVault(profile, amount);
    return await profile.fetch();
  }

  public static async removeBitsFromVault(
    profile: GameProfile,
    amount: number,
    prefix: string
  ): Promise<GameProfile> {
    await ProfileSetter.removeBitsFromVault(profile, amount, prefix);
    return await profile.fetch();
  }

  public static async addCubitsToVault(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.addCubitsToVault(profile, amount);
    return await profile.fetch();
  }

  public static async removeCubitsFromVault(
    profile: GameProfile,
    amount: number,
    prefix: string
  ): Promise<GameProfile> {
    await ProfileSetter.removeCubitsFromVault(profile, amount, prefix);
    return await profile.fetch();
  }

  /*
      Timers
  */
  public static async setDailyTimestamp(
    profile: GameProfile,
    timestamp: string
  ): Promise<GameProfile> {
    await ProfileSetter.setDailyTimestamp(profile.discordId, timestamp);
    return await profile.fetch();
  }

  public static async incrementDailyStreak(
    profile: GameProfile
  ): Promise<GameProfile> {
    await ProfileSetter.incrementDailyStreak(profile.discordId);
    return await profile.fetch();
  }

  public static async resetDailyStreak(
    profile: GameProfile
  ): Promise<GameProfile> {
    await ProfileSetter.resetDailyStreak(profile.discordId);
    return await profile.fetch();
  }

  public static async setDropTimestamp(
    profile: GameProfile,
    timestamp: string
  ): Promise<GameProfile> {
    await ProfileSetter.setDropTimestamp(profile.discordId, timestamp);
    return await profile.fetch();
  }

  public static async setClaimTimestamp(
    profile: GameProfile,
    timestamp: string
  ): Promise<GameProfile> {
    await ProfileSetter.setClaimTimestamp(profile.discordId, timestamp);
    return await profile.fetch();
  }

  /*
      Items
  */
  public static async getItems(
    profile: GameProfile,
    page: number = 1
  ): Promise<GameItem[]> {
    return await ProfileGet.getItems(profile.discordId, page);
  }

  public static async getItem(
    profile: GameProfile,
    itemId: number,
    name: string
  ): Promise<GameItem> {
    return await ProfileGet.getItem(profile.discordId, itemId, name);
  }

  public static async getNumberOfItems(profile: GameProfile): Promise<number> {
    return await ProfileGet.getNumberOfItems(profile.discordId);
  }

  public static async addItems(
    profile: GameProfile,
    items: { item: PrefabItem; count: number }[]
  ): Promise<void> {
    return await ProfileSetter.addItems(profile.discordId, items);
  }

  public static async removeItems(
    profile: GameProfile,
    items: { item: PrefabItem; count: number }[]
  ): Promise<void> {
    return await ProfileSetter.removeItems(profile, items);
  }

  /*
      Tags
  */
  public static async createTag(
    profile: GameProfile,
    name: string,
    emoji: string
  ): Promise<GameTag> {
    return await ProfileSetter.createTag(profile.discordId, name, emoji);
  }

  public static async getTags(profile: GameProfile): Promise<GameTag[]> {
    return await ProfileGet.getUserTags(profile.discordId);
  }

  public static async deleteTag(tag: GameTag): Promise<void> {
    return await ProfileSetter.deleteTag(tag.id);
  }

  public static async editTag(
    tag: GameTag,
    name?: string,
    emoji?: string
  ): Promise<GameTag> {
    return await ProfileSetter.editTag(tag, name, emoji);
  }

  public static async getTagById(tagId: number): Promise<GameTag> {
    return await ProfileGet.getTagById(tagId);
  }

  /*
      DM Scheduler
  */

  public static async getAvailableReminderRecipients(): Promise<GameProfile[]> {
    return await ProfileGet.getAvailableReminderRecipients();
  }

  public static async setUserClaimReminded(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.setUserClaimReminded(profiles);
  }

  public static async setUserDropReminded(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.setUserDropReminded(profiles);
  }

  public static async setUserVoteReminded(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.setUserVoteReminded(profiles);
  }

  public static async toggleDropReminders(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.toggleDropReminders(
      profiles.map((p) => p.discordId)
    );
  }

  public static async toggleClaimReminders(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.toggleClaimReminders(
      profiles.map((p) => p.discordId)
    );
  }

  public static async toggleVoteReminders(
    profiles: GameProfile[]
  ): Promise<void> {
    return await ProfileSetter.toggleVoteReminders(
      profiles.map((p) => p.discordId)
    );
  }

  public static async disableReminders(profiles: GameProfile[]): Promise<void> {
    return await ProfileSetter.disableReminders(
      profiles.map((p) => p.discordId)
    );
  }

  /*
      Dyes
  */
  public static async addDye(
    profile: GameProfile,
    color: { r: number; g: number; b: number }
  ): Promise<GameDye> {
    return await ProfileSetter.addDye(profile.discordId, color);
  }

  public static async getUserDyes(
    profile: GameProfile,
    page: number = 1
  ): Promise<GameDye[]> {
    return await ProfileGet.getUserDyes(profile.discordId, page);
  }

  public static async getUserDyeCount(profile: GameProfile): Promise<number> {
    return await ProfileGet.getUserDyeCount(profile.discordId);
  }

  public static async addChargesToDye(
    dye: GameDye,
    amount: number = 1
  ): Promise<GameDye> {
    await ProfileSetter.addChargesToDye(dye.id, amount);
    return await dye.fetch();
  }

  public static async removeChargesFromDye(
    dye: GameDye,
    amount: number = 1
  ): Promise<GameDye> {
    await ProfileSetter.removeChargesFromDye(dye.id, amount);
    return await dye.fetch();
  }

  public static async getDyeById(id: number): Promise<GameDye> {
    return await ProfileGet.getDyeById(id);
  }

  public static async getDyeByIdentifier(identifier: string): Promise<GameDye> {
    if (identifier.startsWith("$")) identifier = identifier.slice(1);
    return await ProfileGet.getDyeById(parseInt(identifier, 36));
  }

  public static async burnDyes(dyes: GameDye[]): Promise<void> {
    return await ProfileSetter.burnDyes(dyes);
  }

  public static async transferDyesToUser(
    dyes: GameDye[],
    profile: GameProfile
  ): Promise<void> {
    return await ProfileSetter.transferDyesToUser(dyes, profile);
  }

  public static async setPatronTier(
    profile: GameProfile,
    tier: number
  ): Promise<void> {
    return await ProfileSetter.setPatronTier(profile, tier);
  }

  public static async blacklistUser(
    profile: GameProfile
  ): Promise<GameProfile> {
    return await ProfileSetter.blacklistUser(profile);
  }

  public static async unblacklistUser(
    profile: GameProfile
  ): Promise<GameProfile> {
    return await ProfileSetter.unblacklistUser(profile);
  }

  public static async addVote(
    voter: GameProfile,
    isWeekend: boolean
  ): Promise<GameProfile> {
    await ProfileSetter.addVote(voter, isWeekend);
    return await voter.fetch();
  }

  public static async addCubits(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.addCubits(profile, amount);

    return await profile.fetch();
  }
  public static async removeCubits(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    await ProfileSetter.removeCubits(profile, amount);

    return await profile.fetch();
  }

  public static getPrefabItemById(id: number): PrefabItem {
    return items.filter((i) => i.id === id)[0];
  }

  public static async setBooster(
    profile: GameProfile,
    groupId: number,
    count: number
  ): Promise<GameProfile> {
    await ProfileSetter.setBooster(profile, groupId, count);

    return await profile.fetch();
  }

  public static async clearBooster(profile: GameProfile): Promise<GameProfile> {
    await ProfileSetter.clearBooster(profile);

    return await profile.fetch();
  }

  public static async decrementBooster(
    profile: GameProfile
  ): Promise<GameProfile> {
    return await ProfileSetter.decrementBooster(profile);
  }

  public static async setProfileCreationDate(
    profile: GameProfile,
    date: string
  ): Promise<GameProfile> {
    await ProfileSetter.setProfileCreationDate(profile, date);

    return await profile.fetch();
  }
}
