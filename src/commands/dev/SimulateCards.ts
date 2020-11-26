import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { Chance } from "chance";

export default class SimulateCards extends BaseCommand {
  names = ["sim"];
  description = `Removes bits from a user's balance.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const loopTime = parseInt(this.options[0]);
    if (isNaN(loopTime)) {
      msg.channel.createMessage("Enter a valid number.");
      return;
    }
    const chance = new Chance();
    const now = Date.now();
    const rolls = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    for (let i = 0; i < loopTime; i++) {
      const tier = chance.weighted(
        [1, 2, 3, 4, 5, 6],
        [1000, 80, 20, 7, 1.5, 0.1]
      );
      rolls[tier as keyof typeof rolls] += 1;
    }

    const after = Date.now();
    await msg.channel.createMessage(
      `Generated **${(
        rolls["1"] +
        rolls["2"] +
        rolls["3"] +
        rolls["4"] +
        rolls["5"] +
        rolls["6"]
      ).toLocaleString()}** cards in **${after - now}ms**. Results:` +
        `\n1 — **${rolls["1"].toLocaleString()}**` +
        `\n2 — **${rolls["2"].toLocaleString()}**` +
        `\n3 — **${rolls["3"].toLocaleString()}**` +
        `\n4 — **${rolls["4"].toLocaleString()}**` +
        `\n5 — **${rolls["5"].toLocaleString()}**` +
        `\n6 — **${rolls["6"].toLocaleString()}**`
    );
  }
}
