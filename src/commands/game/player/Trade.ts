import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
/*import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { createCanvas, loadImage } from "canvas";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";*/
import items from "../../../assets/items.json";

export default class Trade extends BaseCommand {
  names = ["trade"];
  description = "Trades with someone.";
  usage = ["$CMD$ <@mention>"];
  developerOnly = true;
  async exec(_msg: Message, _profile: GameProfile): Promise<void> {
    const itemsRaw = this.options
      .join(" ")
      .split(",")
      .map((i) => i.trim());
    const realItems = [];
    for (let i of itemsRaw) {
      console.log(i);
      const target = items.items.filter(
        (t) => t.name.toLowerCase() === i.toLowerCase()
      );
      if (target[0]) realItems.push(target[0]);
    }

    console.log(realItems);
  }
}
