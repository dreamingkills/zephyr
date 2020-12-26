import { GameBaseCard } from "../../structures/game/BaseCard";
import { GameUserCard } from "../../structures/game/UserCard";

function calculateTalent(card: GameUserCard, _base: GameBaseCard): number {
  let talentTotal = 0;

  if (card.frameId != 1 && card.frameId !== null) {
    talentTotal += 60;
  }
  if (card.dyeR !== null && card.dyeG !== null && card.dyeB !== null) {
    talentTotal += 15;
  }

  return talentTotal;
}

export { calculateTalent };
