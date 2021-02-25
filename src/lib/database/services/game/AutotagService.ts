import { Zephyr } from "../../../../structures/client/Zephyr";
import { GameAutotag } from "../../../../structures/game/Autotag";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameTag } from "../../../../structures/game/Tag";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { AutotagGet } from "../../sql/game/autotag/AutotagGet";
import { CardService } from "./CardService";

export abstract class AutotagService {
  public static async autotag(
    profile: GameProfile,
    tags: GameTag[],
    card: GameUserCard,
    zephyr: Zephyr
  ): Promise<{ tag: number | undefined }> {
    if (tags.length < 1) return { tag: undefined };

    const autotags = [...(await this.getAutotags(profile))].sort(
      (a, b) => b.priority - a.priority
    );

    if (autotags.length < 1) return { tag: undefined };

    const baseCard = zephyr.getCard(card.baseCardId);

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
}

/*

CREATE TABLE autotag
(
    id            INT(11) AUTO_INCREMENT,
    discord_id    VARCHAR(32) NOT NULL,
    autotag_key   ENUM("idol", "group", "wear", "issue"),
    autotag_value SMALLINT NOT NULL,
    PRIMARY KEY(id)
)

*/
