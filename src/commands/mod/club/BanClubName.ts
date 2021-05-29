import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { isIllegalClubName } from "../../../lib/database/sql/game/club/ClubGetter";
import { addIllegalClubName } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";

export default class BanClubName extends BaseCommand {
  id = `paramore`;
  names = [`banclubname`];
  description = `Bans a club name, permanently disallowing its use.`;
  usage = ["$CMD$ <club name>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) {
      await this.send(msg.channel, `Please enter a club name to ban.`);

      return;
    }

    const clubName = options.join(` `)?.toLowerCase();

    const isAlreadyBanned = await isIllegalClubName(clubName);

    if (isAlreadyBanned) {
      await this.send(msg.channel, `That club name is already banned.`);

      return;
    }

    await addIllegalClubName(clubName);

    await this.send(
      msg.channel,
      `:white_check_mark: **${escapeMarkdown(
        clubName
      )}** is now an illegal club name.`
    );

    return;
  }
}
