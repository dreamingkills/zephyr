import { Channel, Constants, TextChannel, User } from "eris";
import { Zephyr } from "../structures/client/Zephyr";
import { ErisFile } from "../structures/client/ErisFile";

function checkPermission(permission: string, channel: Channel): boolean {
  if (!channel || channel.type !== 0) return false;
  return (<TextChannel>channel)
    .permissionsOf(Zephyr.user.id)
    .has(permission as keyof Constants["Permissions"]);
}

function isFile(body: any): body is ErisFile {
  return !!(body as ErisFile).file;
}

function isDeveloper(user: User): boolean {
  return Zephyr.config.developers.includes(user.id);
}

export { checkPermission, isFile, isDeveloper };
