import { GameBaseCard } from "../../../../structures/game/BaseCard";
import { CardGet } from "../../sql/game/card/CardGet";

export abstract class CardService {
  public static async getAllCards(): Promise<GameBaseCard[]> {
    return await CardGet.getAllCards();
  }
}
