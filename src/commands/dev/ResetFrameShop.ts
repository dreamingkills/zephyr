import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { ShopService } from "../../lib/database/services/game/ShopService";

export default class ResetFrameShop extends BaseCommand {
  names = ["resetframeshop", "rfs"];
  description = `Resets the frame shop.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    await ShopService.resetFrameShop();
    await msg.channel.createMessage("OK");
    return;
  }
}
