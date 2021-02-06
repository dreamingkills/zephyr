import { Zephyr } from "../structures/client/Zephyr";
import { ProfileService } from "./database/services/game/ProfileService";
import dayjs from "dayjs";
import { createMessage } from "./discord/message/createMessage";
import { User } from "eris";

export class DMHandler {
  public remindersEnabled = true;

  public async handle(zephyr: Zephyr): Promise<void> {
    const eligible = await ProfileService.getAvailableReminderRecipients();
    const [claimSuccess, dropSuccess, voteSuccess] = [[], [], []] as [
      User[],
      User[],
      User[]
    ];
    const failed = [];
    for (let p of eligible) {
      if (p.blacklisted) {
        failed.push(p);
        continue;
      }
      const user = await zephyr.fetchUser(p.discordId);
      if (!user) {
        failed.push(p);
        continue;
      }

      let [claim, drop, vote] = [false, false, false];

      const now = dayjs(Date.now());
      const nextClaim = dayjs(p.claimNext);
      const nextDrop = dayjs(p.dropNext);
      const nextVote = dayjs(p.voteLast || 0).add(12, `hour`);

      if (nextClaim < now && p.claimReminder && !p.claimReminded) claim = true;
      if (nextDrop < now && p.dropReminder && !p.dropReminded) drop = true;
      if (nextVote < now && p.voteReminder && !p.voteReminded) vote = true;

      if (!claim && !drop && !vote) continue;

      let message = "";
      const types = [];
      if (claim) {
        claimSuccess.push(user);
        types.push("**claim**");
      }
      if (drop) {
        dropSuccess.push(user);
        types.push("**drop**");
      }
      if (vote) {
        voteSuccess.push(user);
        types.push("**vote**");
      }

      if (types.length === 1) {
        message = types[0];
      } else if (types.length === 2) {
        message = types.join(` and `);
      } else if (types.length > 2) {
        message = types.slice(0, -1).join(`, `) + `, and ` + types.slice(-1);
      }

      try {
        const dmChannel = await user.getDMChannel();
        await createMessage(
          dmChannel,
          `:bell: Hey, **${user.username}**! You can now ${message}!`
        );
        continue;
      } catch {
        failed.push(p);
        continue;
      }
    }

    if (claimSuccess.length > 0)
      await ProfileService.setUserClaimReminded(claimSuccess);
    if (dropSuccess.length > 0)
      await ProfileService.setUserDropReminded(dropSuccess);
    if (voteSuccess.length > 0)
      await ProfileService.setUserVoteReminded(voteSuccess);

    if (failed.length > 0) await ProfileService.disableReminders(failed);

    if (this.remindersEnabled) setTimeout(() => this.handle(zephyr), 30000);
  }
}
