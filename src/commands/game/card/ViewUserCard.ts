import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class ViewUserCard extends BaseCommand {
  names = ["card", "show", "view"];
  description = "Inspects one of your cards.";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const reference = {
      identifier: this.options[0]?.split("#")[0]?.toUpperCase(),
      serialNumber: parseInt(this.options[0]?.split("#")[1]),
    };
    if (isNaN(reference.serialNumber))
      throw new ZephyrError.InvalidCardReferenceError();

    const userCard = await CardService.getUserCardByReference(reference);
    const image = await CardService.checkCacheForCard(userCard);

    await msg.channel.createMessage("", {
      file: image,
      name: "card.png",
    });
  }
}
