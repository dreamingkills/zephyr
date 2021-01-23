import { Zephyr } from "../../../structures/client/Zephyr";
import { GameDye } from "../../../structures/game/Dye";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
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
  giver: GameProfile,
  zephyr: Zephyr
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

  if (cards.length > 0)
    await CardService.transferCardsToUser(cards, receiver, zephyr);
  if (items.length > 0) {
    await ProfileService.addItems(receiver, items);
    await ProfileService.removeItems(giver, items);
  }
  if (dyes.length > 0) await ProfileService.transferDyesToUser(dyes, receiver);
  if (bits > 0) {
    await ProfileService.addBitsToProfile(receiver, bits);
    await ProfileService.removeBitsFromProfile(giver, bits);
  }
  if (cubits > 0) {
    await ProfileService.addCubits(receiver, cubits);
    await ProfileService.removeCubits(giver, cubits);
  }

  return;
}
