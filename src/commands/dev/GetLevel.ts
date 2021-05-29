import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { CardService } from "../../lib/database/services/game/CardService";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class GetLevel extends BaseCommand {
  names = ["getlevel"];
  description = `Gets a card's level.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const identifier = options[0];
    if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByIdentifier(identifier);

    const lvl = CardService.getLevel(userCard);

    await this.send(msg.channel, `Level: ${lvl} / ${userCard.experience} exp`);

    return;
  }
}
