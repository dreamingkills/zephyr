import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { getClubByName } from "../../../lib/database/sql/game/club/ClubGetter";
import { deleteClub } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { ReactionCollector } from "eris-collector";

export default class ForceAbandon extends BaseCommand {
  id = `solanine`;
  names = [`forceabandon`];
  description = `Forcibly abandons a club.`;
  usage = ["$CMD$ <club name>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) {
      await this.send(
        msg.channel,
        `Please enter a club name to forcibly abandon.`
      );

      return;
    }

    const clubName = options.join(` `)?.toLowerCase();

    const club = await getClubByName(clubName);

    if (!club) {
      await this.send(msg.channel, `There is no club by that name.`);

      return;
    }

    const confirmation = await this.send(
      msg.channel,
      `Really force abandon **${escapeMarkdown(
        club.name
      )}**? This is irreversible.`
    );

    const confirmed: boolean = await new Promise(async (res) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id && emoji.name === "☑";

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 15000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        res(false);
        return await this.handleError(msg, msg.author, e);
      });

      collector.on("collect", () => {
        res(true);
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") res(false);
      });

      await this.react(confirmation, "☑");
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        `*This force abandon confirmation has expired.*`
      );

      return;
    }

    await deleteClub(club);

    await this.send(
      msg.channel,
      `:white_check_mark: Forcibly abandoned **${escapeMarkdown(club.name)}**.`
    );

    return;
  }
}
