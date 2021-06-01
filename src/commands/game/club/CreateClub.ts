import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  addUserToClub,
  createClub,
} from "../../../lib/database/sql/game/club/ClubSetter";
import {
  getClubByName,
  getUserClubMembership,
  isIllegalClubName,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

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
    if (profile.bits < Zephyr.modifiers.clubCreationPrice)
      throw new ClubError.NotEnoughBitsToCreateClubError();

    const userMembership = await getUserClubMembership(profile);

    if (userMembership.length > Zephyr.modifiers.userClubMembershipLimit)
      throw new ClubError.ClubLimitError();

    const clubName = options.join(` `);

    if (!clubName || clubName.length > 32)
      throw new ClubError.InvalidClubNameInCreationError();

    const clubExists = await getClubByName(clubName);

    if (clubExists) throw new ClubError.ClubNameTakenError();

    if (await isIllegalClubName(clubName))
      throw new ClubError.IllegalClubNameError();

    const confirmationEmbed = new MessageEmbed(
      `Create Club`,
      msg.author
    ).setDescription(
      `Really spend **${Zephyr.modifiers.clubCreationPrice.toLocaleString()}** bits to create **${clubName}**?\nThis action is irreversible.`
    );

    const confirmation = await this.send(msg.channel, confirmationEmbed);

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
        confirmationEmbed.setFooter(`🕒 This confirmation has timed out.`)
      );

      return;
    }

    const refetch = await profile.fetch();

    if (refetch.bits < Zephyr.modifiers.clubCreationPrice)
      throw new ClubError.NotEnoughBitsToCreateClubError();

    await ProfileService.removeBitsFromProfile(profile, 5000);

    await this.delete(confirmation);

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
