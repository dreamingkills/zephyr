import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { Chance } from "chance";

export default class SimulateCards extends BaseCommand {
  names = ["sim"];
  description = `Removes bits from a user's balance.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const loopTime = parseInt(options[0], 10);
    if (isNaN(loopTime)) {
      this.send(msg.channel, "Enter a valid number.");
      return;
    }
    const chance = new Chance();
    const now = Date.now();
    const rolls = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (let i = 0; i < loopTime; i++) {
      const tier = chance.weighted(
        [0, 1, 2, 3, 4, 5],
        [10, 25, 30, 23.6, 14.6, 6.6]
      );
      rolls[tier as keyof typeof rolls] += 1;
    }

    const after = Date.now();
    await this.send(
      msg.channel,
      `Generated **${(
        rolls["0"] +
        rolls["1"] +
        rolls["2"] +
        rolls["3"] +
        rolls["4"] +
        rolls["5"]
      ).toLocaleString()}** cards in **${after - now}ms**. Results:` +
        `\n1 — **${rolls["0"].toLocaleString()}**` +
        `\n2 — **${rolls["1"].toLocaleString()}**` +
        `\n3 — **${rolls["2"].toLocaleString()}**` +
        `\n4 — **${rolls["3"].toLocaleString()}**` +
        `\n5 — **${rolls["4"].toLocaleString()}**` +
        `\n6 — **${rolls["5"].toLocaleString()}**`
    );
  }
}
