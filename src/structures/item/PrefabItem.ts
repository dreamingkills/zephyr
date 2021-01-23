import { Message } from "eris";
import { Zephyr } from "../client/Zephyr";
import { GameProfile } from "../game/Profile";

export interface PrefabItem {
  id: number;
  names: string[];
  useCost?: number;
  requiredArguments?: number;
  description?: string;
  usage?: string;
  emoji: string;
  use?: (
    msg: Message,
    profile: GameProfile,
    parameters: string[],
    zephyr: Zephyr
  ) => Promise<void>;
}
