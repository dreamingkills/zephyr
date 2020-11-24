import { GameBaseCard } from "../../../../structures/game/BaseCard";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { CardGet } from "../../sql/game/card/CardGet";

export interface CardReference {
  identifier: string;
  serialNumber: number;
}

export abstract class CardService {
  public static parseReference(ref: CardReference): string {
    return `${ref.identifier}#${ref.serialNumber}`;
  }

  public static async getAllCards(): Promise<GameBaseCard[]> {
    return await CardGet.getAllCards();
  }

  /*
      UserCards
  */
  public static async getUserCardById(id: number): Promise<GameUserCard> {
    return await CardGet.getUserCardById(id);
  }
  public static async getUserCardByReference(
    ref: CardReference
  ): Promise<GameUserCard> {
    return await CardGet.getUserCardByReference(ref);
  }
}
