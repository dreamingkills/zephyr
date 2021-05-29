import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import { getClubByName } from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { deleteClub } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { ReactionCollector } from "eris-collector";

export default class AbandonClub extends BaseCommand {
  id = `mitski`;
  names = [`abandon`];
  description = `Abandons a club. Only usable by the club owner.`;
  usage = [`$CMD$ <club name>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const clubName = options.join(` `);

    if (!clubName) throw new ClubError.InvalidClubNameInViewerError();

    const club = await getClubByName(clubName);

    if (!club) throw new ClubError.NoClubByNameError();

    if (club.ownerId !== msg.author.id)
      throw new ClubError.NotOwnerOfClubError();

    const embed = new MessageEmbed(`Abandon Club`, msg.author).setDescription(
      `Really abandon **${escapeMarkdown(
        club.name
      )}**? This cannot be reversed, and you will not be compensated.`
    );

    const confirmation = await this.send(msg.channel, embed);

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
        embed.setFooter(`🕒 This confirmation has expired.`)
      );

      return;
    }

    await deleteClub(club);

    await this.edit(
      confirmation,
      embed.setDescription(`:white_check_mark: You abandoned **${club.name}**.`)
    );

    return;
  }
}
