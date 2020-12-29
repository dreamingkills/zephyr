import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { ShopService } from "../../lib/database/services/game/ShopService";

export default class ResetFrameShop extends BaseCommand {
  names = ["resetframeshop", "rfs"];
  description = `Resets the frame shop.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await ShopService.resetFrameShop();
    await msg.channel.createMessage("OK");
    return;
  }
}
