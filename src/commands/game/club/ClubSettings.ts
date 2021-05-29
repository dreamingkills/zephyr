import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import { getClubByName } from "../../../lib/database/sql/game/club/ClubGetter";
import { Zephyr } from "../../../structures/client/Zephyr";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import {
  setClubBlurb,
  setClubClosed,
  setClubOpen,
  setClubOwner,
} from "../../../lib/database/sql/game/club/ClubSetter";
import {
  escapeMarkdown,
  isValidSnowflake,
} from "../../../lib/utility/text/TextUtils";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ClubSettings extends BaseCommand {
  id = `radioactive`;
  names = [`clubsettings`, `cs`];
  description = `Allows you to change properties of a club owned by you.`;
  usage = [`$CMD$ <club name>, <setting>, <value>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const args = options.join(` `);

    const clubName = args.split(`,`)[0]?.trim().toLowerCase();
    const setting = args.split(`,`)[1]?.trim().toLowerCase();
    const value = args.split(`,`).slice(2).join(`,`)?.trim();

    if (!clubName || clubName.length > 20)
      throw new ClubError.InvalidClubNameInViewerError();

    let club = await getClubByName(clubName);

    if (!club) throw new ClubError.NoClubByNameError();
    if (club.ownerId !== msg.author.id)
      throw new ClubError.NotOwnerOfClubError();

    if (!setting) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      const embed = new MessageEmbed(`Club Settings`, msg.author)
        .setTitle(`${club.name} settings`)
        .addField({
          name: `General Settings`,
          value:
            `**Open Club?**: ${club.open ? `YES` : `NO`}` +
            `\n\`${prefix}cs ${club.name.toLowerCase()}, open, yes/no\`` +
            `\n**Blurb Set?**: ${club.blurb ? `YES` : `NO`}` +
            `\n\`${prefix}cs ${club.name.toLowerCase()}, blurb, Text goes here.\`` +
            `\n**Transfer Ownership**` +
            `\n\`${prefix}cs ${club.name.toLowerCase()}, setowner, mention/user id\``,
          inline: true,
        });

      await this.send(msg.channel, embed);
      return;
    }

    const prefix = Zephyr.getPrefix(msg.guildID);
    if (!value) {
      throw new ClubError.InvalidClubSettingValueError(prefix, club);
    }

    let embed: MessageEmbed;

    switch (setting) {
      case `open`: {
        if (![`yes`, `no`].includes(value.toLowerCase()))
          throw new ClubError.InvalidClubSettingValueError(prefix, club);

        if ((value === `yes` && club.open) || (value === `no` && !club.open))
          throw new ClubError.ClubOpenStatusConflictError(club.open);

        if (value.toLowerCase() === `yes`) {
          club = await setClubOpen(club);
        } else if (value.toLowerCase() === `no`) {
          club = await setClubClosed(club);
        }

        embed = new MessageEmbed(`Club Settings`, msg.author).setDescription(
          `Your club is now **${club.open ? `open` : `closed`}**.`
        );

        break;
      }
      case `blurb`: {
        await setClubBlurb(club, value);

        embed = new MessageEmbed(`Club Settings`, msg.author).setDescription(
          `Your club blurb was set to...\n\n${value}`
        );

        break;
      }
      case `setowner`: {
        let user = msg.mentions[0];

        if (!user) {
          if (!isValidSnowflake(value))
            throw new ClubError.InvalidTransferSnowflakeError();

          const targetUser = await Zephyr.fetchUser(value);

          if (!targetUser) throw new ClubError.InvalidTransferSnowflakeError();

          user = targetUser;
        }

        const profile = await ProfileService.getProfile(user.id);

        const confirmationEmbed = new MessageEmbed(
          `Transfer Club Ownership`,
          msg.author
        ).setDescription(
          `Really transfer ownership of **${escapeMarkdown(
            club.name
          )}** to **${escapeMarkdown(user.tag)}**? This action is irreversible.`
        );

        const confirmation = await this.send(msg.channel, confirmationEmbed);

        const confirmed: boolean = await new Promise(async (res) => {
          const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
            user.id === msg.author.id && emoji.name === "☑";

          const collector = new ReactionCollector(
            Zephyr,
            confirmation,
            filter,
            {
              time: 15000,
              max: 1,
            }
          );

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
            confirmationEmbed.setFooter(`🕒 This confirmation has expired.`)
          );

          return;
        }

        await setClubOwner(club, profile);

        embed = new MessageEmbed(`Club Settings`, msg.author).setDescription(
          `:white_check_mark: Ownership of **${escapeMarkdown(
            club.name
          )}** was transferred to **${escapeMarkdown(user.tag)}**.`
        );
        break;
      }
      default: {
        throw new ClubError.InvalidClubSettingError(prefix, club);
      }
    }

    await this.send(msg.channel, embed);

    return;
  }
}
