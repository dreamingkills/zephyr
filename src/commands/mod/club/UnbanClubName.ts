import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { isIllegalClubName } from "../../../lib/database/sql/game/club/ClubGetter";
import { deleteIllegalClubName } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";

export default class BanClubName extends BaseCommand {
  id = `incubus`;
  names = [`unbanclubname`];
  description = `Unbans a club name.`;
  usage = ["$CMD$ <club name>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) {
      await this.send(msg.channel, `Please enter a club name to unban.`);

      return;
    }

    const clubName = options.join(` `)?.toLowerCase();

    const isAlreadyBanned = await isIllegalClubName(clubName);

    if (!isAlreadyBanned) {
      await this.send(msg.channel, `That club name is not banned.`);

      return;
    }

    await deleteIllegalClubName(clubName);

    await this.send(
      msg.channel,
      `:white_check_mark: **${escapeMarkdown(
        clubName
      )}** is no longer an illegal club name.`
    );

    return;
  }
}
