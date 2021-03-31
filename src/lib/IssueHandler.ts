import { GameBaseCard } from "../structures/game/BaseCard";
import { DB } from "./database";

export abstract class IssueHandler {
  public static queueIssueGeneration = (() => {
    let pending = Promise.resolve();
    const run = async (card: GameBaseCard): Promise<any> => {
      try {
        await pending;
      } finally {
        await DB.query(`UPDATE card_base SET serial_total=? WHERE id=?;`, [
          card.serialTotal + 1,
          card.id,
        ]);
        return card.serialTotal + 1;
      }
    };
    return (card: GameBaseCard) => (pending = run(card));
  })();
}
