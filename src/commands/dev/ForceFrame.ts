import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { CardService } from "../../lib/database/services/game/CardService";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class ForceFrame extends BaseCommand {
  names = ["forceframe"];
  description = `Force changes a card's frame.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const identifier = options[0];
    if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByIdentifier(identifier);

    const frameId = parseInt(options[1]);

    const pic = await CardService.changeCardFrame(
      userCard,
      frameId,
      this.zephyr
    );

    await this.send(msg.channel, "OK", {
      files: [{ file: pic, name: "card.png" }],
    });

    return;
  }
}
