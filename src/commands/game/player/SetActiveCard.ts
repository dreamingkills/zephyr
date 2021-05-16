import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileSetter } from "../../../lib/database/sql/game/profile/ProfileSetter";
import { GameUserCard } from "../../../structures/game/UserCard";

export default class SetActiveCard extends BaseCommand {
  id = `humility`;
  names = [`setactive`, `sa`];
  description = `Marks a card as your **Active**, enabling experience gain.`;
  usage = [`$CMD$ <card>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let targetCard: GameUserCard;

    if (!options[0]) {
      const lastCard = await CardService.getLastCard(profile);

      targetCard = lastCard;
    } else {
      targetCard = await CardService.getUserCardByIdentifier(options[0]);
    }

    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);

    await ProfileSetter.setActiveCard(profile, targetCard);

    const embed = new MessageEmbed(`Active Card`, msg.author).setDescription(
      `:white_check_mark: Your **Active** card was set to \`${targetCard.id.toString(
        36
      )}\`.`
    );
    await this.send(msg.channel, embed);

    return;
  }
}
