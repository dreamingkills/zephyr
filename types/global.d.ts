import { GameDye } from "../src/structures/game/Dye";
import { BaseItem } from "../src/structures/game/Item";
import { GameUserCard } from "../src/structures/game/UserCard";

declare type InteractableBits = { bits: number };
declare type InteractableCubits = { cubits: number };
declare type InteractableItem = { item: BaseItem; count: number };
declare type TradeItemResolvable =
  | GameUserCard
  | GameDye
  | InteractableBits
  | InteractableCubits
  | InteractableItem;

declare global {
  interface TradeItemResolvable {}
  interface InteractableBits {
    bits: number;
  }
  interface InteractableCubits {
    cubits: number;
  }
  interface InteractableItem {
    item: BaseItem;
    count: number;
  }
}
