import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { calculateTalent } from "../../../lib/talent";

export default class ViewTalent extends BaseCommand {
  names = ["talent", "ta"];
  description = "Inspects the talent of your cards.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const reference = this.options[0];
    if (!reference) throw new ZephyrError.InvalidCardReferenceError();

    const card = await CardService.getUserCardByIdentifier(reference);
    const base = this.zephyr.getCard(card.baseCardId);

    const talent = calculateTalent(card, base);
    await msg.channel.createMessage(`Talent: ${talent}`);
  }
}
