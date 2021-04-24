import { Zephyr } from "../../../../structures/client/Zephyr";
import { GameAutotag } from "../../../../structures/game/Autotag";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameTag } from "../../../../structures/game/Tag";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { AutotagGet } from "../../sql/game/autotag/AutotagGet";
import { AutotagSet } from "../../sql/game/autotag/AutotagSet";
import { CardService } from "./CardService";

export abstract class AutotagService {
  public static async autotag(
    profile: GameProfile,
    tags: GameTag[],
    card: GameUserCard
  ): Promise<{ tag: number | undefined }> {
    if (tags.length < 1) return { tag: undefined };

    const autotags = [...(await this.getAutotags(profile))].sort(
      (a, b) => b.priority - a.priority
    );

    if (autotags.length < 1) return { tag: undefined };

    const baseCard = Zephyr.getCard(card.baseCardId);

    if (!baseCard) return { tag: undefined };

    for (let tag of autotags) {
      switch (tag.key) {
        case `idol`: {
          if (tag.value === baseCard.idolId) {
            await CardService.setCardsTag([card], tag.tagId);
            return { tag: tag.tagId };
          }
          break;
        }
        case `group`: {
          if (tag.value === baseCard.groupId) {
            await CardService.setCardsTag([card], tag.tagId);
            return { tag: tag.tagId };
          }
          break;
        }
        case `issue`: {
          if (tag.value === card.serialNumber) {
            await CardService.setCardsTag([card], tag.tagId);
            return { tag: tag.tagId };
          }
          break;
        }
        case `wear`: {
          if (tag.value === card.wear) {
            await CardService.setCardsTag([card], tag.tagId);
            return { tag: tag.tagId };
          }
          break;
        }
      }
    }

    // No autotags matched...
    return { tag: undefined };
  }

  public static async getAutotags(
    profile: GameProfile
  ): Promise<GameAutotag[]> {
    return await AutotagGet.getAutotags(profile);
  }

  public static async getAutotagById(id: number): Promise<GameAutotag> {
    return await AutotagGet.getAutotagById(id);
  }

  /*
        Set
  */
  public static async createAutotag(
    profile: GameProfile,
    key: AutotagKey,
    value: number,
    priority: number
  ): Promise<GameAutotag> {
    return await AutotagSet.createAutotag(profile, key, value, priority);
  }

  public static async deleteAutotag(autotag: GameAutotag): Promise<void> {
    return await AutotagSet.deleteAutotag(autotag);
  }

  public static async setAutotagKey(
    autotag: GameAutotag,
    key: AutotagKey
  ): Promise<GameAutotag> {
    return await AutotagSet.setAutotagKey(autotag, key);
  }

  public static async setAutotagValue(
    autotag: GameAutotag,
    value: number
  ): Promise<GameAutotag> {
    return await AutotagSet.setAutotagValue(autotag, value);
  }

  public static async setAutotagPriority(
    autotag: GameAutotag,
    priority: number
  ): Promise<GameAutotag> {
    return await AutotagSet.setAutotagPriority(autotag, priority);
  }
}
