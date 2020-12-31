import {
  GameCompletion,
  TotalCompletion,
} from "../../../../structures/game/Completion";
import { GameProfile } from "../../../../structures/game/Profile";
import { CardGet } from "../../sql/game/card/CardGet";
import { CompletionGet } from "../../sql/game/card/CompletionGet";

export abstract class CompletionService {
  public static subgroupCompletion(
    profile: GameProfile,
    group: string,
    subgroup: string
  ): Promise<GameCompletion[]> {
    return CardGet.subgroupCompletion(profile.discordId, group, subgroup);
  }

  public static totalCompletion(
    profile: GameProfile
  ): Promise<TotalCompletion[]> {
    return CompletionGet.totalCompletion(profile.discordId);
  }
}
