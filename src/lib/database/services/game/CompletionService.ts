import {
  GameCompletion,
  GameGroupCompletion,
  TotalCompletion,
} from "../../../../structures/game/Completion";
import { GameProfile } from "../../../../structures/game/Profile";
import { CompletionGet } from "../../sql/game/card/CompletionGet";

export abstract class CompletionService {
  public static async subgroupCompletion(
    profile: GameProfile,
    group: string | undefined,
    subgroup: string
  ): Promise<GameCompletion[]> {
    return await CompletionGet.subgroupCompletion(
      profile.discordId,
      group,
      subgroup
    );
  }

  public static totalCompletion(
    profile: GameProfile
  ): Promise<TotalCompletion[]> {
    return CompletionGet.totalCompletion(profile.discordId);
  }

  public static groupCompletion(
    profile: GameProfile,
    group: string
  ): Promise<GameGroupCompletion[]> {
    return CompletionGet.groupCompletion(profile.discordId, group);
  }

  public static async memberCompletion(
    profile: GameProfile,
    group: string | undefined,
    individualName: string
  ): Promise<GameCompletion[]> {
    return await CompletionGet.memberCompletion(
      profile.discordId,
      group,
      individualName
    );
  }
}
