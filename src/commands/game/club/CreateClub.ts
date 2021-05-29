import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  addUserToClub,
  createClub,
} from "../../../lib/database/sql/game/club/ClubSetter";
import {
  getClubByName,
  isIllegalClubName,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class CreateClub extends BaseCommand {
  id = `nirvana`;
  names = [`createclub`, `cc`];
  description = `Creates a new club with a name of your choosing.`;
  usage = [`$CMD$ <club name>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const clubName = options.join(` `);

    if (!clubName || clubName.length > 32)
      throw new ClubError.InvalidClubNameInCreationError();

    const clubExists = await getClubByName(clubName);

    if (clubExists) throw new ClubError.ClubNameTakenError();

    if (await isIllegalClubName(clubName))
      throw new ClubError.IllegalClubNameError();

    const club = await createClub(profile, clubName);
    await addUserToClub(club, profile);

    const prefix = Zephyr.getPrefix(msg.guildID);

    const embed = new MessageEmbed(`Create Club`, msg.author).setDescription(
      `:white_check_mark: **Club created successfully!**\nTo change your club settings, use \`${prefix}cs ${club.name.toLowerCase()}\`.`
    );

    await this.send(msg.channel, embed);

    return;
  }
}
