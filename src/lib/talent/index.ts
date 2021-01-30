import { GameBaseCard } from "../../structures/game/BaseCard";
import { GameProfile } from "../../structures/game/Profile";
import { GameUserCard } from "../../structures/game/UserCard";

export type Talent = {
  total: number;
  frame: number;
  dye: number;
  fight: number;
  quickness: number;
  purity: number;
  print: number;
  claimer: number;
  dropper: number;
};

export function calculateTalent(
  owner: GameProfile,
  card: GameUserCard,
  _base: GameBaseCard
): Talent {
  const fightCoefficient = 0.6;
  const quicknessCoefficient = 6.0;
  // const printCoefficient = 0.2;

  const wearMultiplier = (1 + card.wear) / 6;

  let talents: Talent = {
    total: 0,
    frame: 0,
    dye: 0,
    fight: 0,
    quickness: 0,
    purity: 0,
    print: 0,
    claimer: 0,
    dropper: 0,
  };

  // Frame Talent
  if (
    card.frameId &&
    card.frameId != 1 &&
    card.frameId !== null &&
    card.wear === 5
  ) {
    talents.frame += Math.floor(60 * wearMultiplier);
  }

  // Dye Talent
  if (
    card.dyeR !== null &&
    card.dyeG !== null &&
    card.dyeB !== null &&
    card.wear === 5
  ) {
    talents.dye += Math.floor(15 * wearMultiplier);
  }

  // Fight Talent
  const fightTalent = Math.floor(card.fightCount * fightCoefficient);
  talents.fight += Math.min(Math.floor(fightTalent * wearMultiplier), 7);

  // Claim Time Talent
  const claimTime = parseFloat(((card.claimTime - 5000) / 1000).toFixed(2));
  const quicknessTalent = Math.floor(6.3 * (quicknessCoefficient / claimTime));
  talents.quickness += Math.floor(quicknessTalent * wearMultiplier);

  // Purity Talent
  const wearDifference = Math.max(0, card.wear - card.originalWear);

  const purityTalent = Math.floor((10 / (1 + wearDifference)) * 2);
  talents.purity += Math.floor(purityTalent * wearMultiplier);

  /*
  // Print Talent
  const printTalent = (base.serialTotal / card.serialNumber) * printCoefficient;
  talents.print += Math.floor(printTalent * wearMultiplier);
  */

  // Claimer Talent
  if (card.originalOwner === owner.discordId) {
    talents.claimer += Math.floor(10 * wearMultiplier);
  }

  // Dropper Talent
  if (card.discordId === card.dropper) {
    talents.dropper += Math.floor(10 * wearMultiplier);
  }

  // Calculate Total
  const total = Object.values(talents).reduce((a, b) => {
    return a + b;
  });
  talents.total = total;

  return talents;
}
