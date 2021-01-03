import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameUserCard } from "../../../structures/game/UserCard";

export default class CardCollage extends BaseCommand {
  names = ["collage"];
  description = "Shows you a collage of cards.";
  usage = ["$CMD$ [card]"];
  developerOnly = true;
  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const identifiers = options.filter((o) => !o.includes("<@"));
    if (identifiers.length === 0)
      throw new ZephyrError.InvalidCardReferenceError();

    const cards: GameUserCard[] = [];
    for (let ref of identifiers) {
      if (!ref) throw new ZephyrError.InvalidCardReferenceError();
      const card = await CardService.getUserCardByIdentifier(ref);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);
      cards.push(card);
    }

    const collage = await CardService.generateAlbum(
      cards,
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414_%28NASA-med%29.jpg/1280px-NGC_4414_%28NASA-med%29.jpg",
      this.zephyr
    );

    await this.send(msg.channel, "Collage:", {
      file: {
        file: collage,
        name: "collage.png",
      },
    });
    return;
  }
}
