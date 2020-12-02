import { Message, TextChannel } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { CardSpawner } from "../../lib/CardSpawner";
import { GameDroppedCard } from "../../structures/game/DroppedCard";

export default class ForceFrame extends BaseCommand {
  names = ["forcedrop", "fd"];
  description = `Forcibly drops cards (as if by server activity).`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const cards = this.zephyr.getRandomCards(3);
    const droppedCards = cards.map(
      (c) =>
        new GameDroppedCard({
          id: c.id,
          identifier: c.identifier,
          serialNumber: c.serialTotal + 1,
          frameUrl: `./src/assets/frames/frame-white.png`,
        })
    );
    await CardSpawner.forceDrop(
      msg.channel as TextChannel,
      droppedCards,
      this.zephyr
    );
    return;
  }
}
