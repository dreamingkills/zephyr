import { GameDye } from "../../../structures/game/Dye";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { AutotagService } from "../../database/services/game/AutotagService";
import { CardService } from "../../database/services/game/CardService";
import { ProfileService } from "../../database/services/game/ProfileService";
import {
  isBitItem,
  isCubitItem,
  isInteractableItem,
} from "./typeguards/MultitradeTypeguards";

export async function transferItems(
  tradeItems: TradeItemResolvable[],
  receiver: GameProfile,
  giver: GameProfile
): Promise<void> {
  const cards = tradeItems.filter(
    (i) => i instanceof GameUserCard
  ) as GameUserCard[];

  const dyes = tradeItems.filter((i) => i instanceof GameDye) as GameDye[];

  const items = tradeItems.filter((i) =>
    isInteractableItem(i)
  ) as InteractableItem[];

  const { bits } =
    (tradeItems.find((i) => isBitItem(i)) as InteractableBits) || 0;

  const { cubits } =
    (tradeItems.find((i) => isCubitItem(i)) as InteractableCubits) || 0;

  if (cards.length > 0) {
    await CardService.transferCardsToUser(cards, giver, receiver);

    const tags = await receiver.getTags();
    if (tags.length > 0) {
      for (let card of cards) {
        await AutotagService.autotag(receiver, tags, await card.fetch());
      }
    }
  }
  if (items.length > 0) {
    await ProfileService.removeItems(giver, items);
    await ProfileService.addItems(receiver, items);
  }
  if (dyes.length > 0) await ProfileService.transferDyesToUser(dyes, receiver);
  if (bits > 0) {
    await ProfileService.removeBitsFromProfile(giver, bits);
    await ProfileService.addBitsToProfile(receiver, bits);
  }
  if (cubits > 0) {
    await ProfileService.removeCubits(giver, cubits);
    await ProfileService.addCubits(receiver, cubits);
  }

  return;
}
