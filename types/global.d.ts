import { GameDye } from "../src/structures/game/Dye";
import { GameUserCard } from "../src/structures/game/UserCard";
import { PrefabItem } from "../src/structures/item/PrefabItem";

declare type InteractableBits = { bits: number };
declare type InteractableCubits = { cubits: number };
declare type InteractableItem = { item: PrefabItem; count: number };
declare type TradeItemResolvable =
  | GameUserCard
  | GameDye
  | InteractableBits
  | InteractableCubits
  | InteractableItem;

declare type AlbumCard = { card: GameUserCard; slot: number };

declare global {
  interface TradeItemResolvable {}
  interface InteractableBits {
    bits: number;
  }
  interface InteractableCubits {
    cubits: number;
  }
  interface InteractableItem {
    item: PrefabItem;
    count: number;
  }
  interface AlbumCard {
    card: GameUserCard;
    slot: number;
  }
}
