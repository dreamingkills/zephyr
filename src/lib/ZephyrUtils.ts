import { Dayjs } from "dayjs";
import { Channel, TextChannel } from "eris";
import { Zephyr } from "../structures/client/Zephyr";

function padIfNotLeading(text: string | number, leading: boolean): string {
  return leading ? text.toString() : text.toString().padStart(2, "0");
}

function getTimeUntilNextDay(timestamp: Dayjs): string {
  const nextDay = timestamp.add(1, "day");

  const days = nextDay.diff(Date.now(), "d");
  const hours = nextDay.diff(Date.now(), "h");
  const minutes = nextDay.diff(Date.now(), "m") - hours * 60;
  const seconds =
    nextDay.diff(Date.now(), "s") - nextDay.diff(Date.now(), "m") * 60;

  const daysText = days > 0 ? `${days}d ` : ``;
  const hoursText =
    hours > 0 ? `${padIfNotLeading(hours - days * 24, days === 0)}h ` : ``;
  const minutesText =
    minutes > 0 ? `${padIfNotLeading(minutes, hours === 0)}m ` : ``;
  const secondsText =
    seconds > 0 ? `${padIfNotLeading(seconds, minutes === 0)}s` : ``;

  return (
    `${daysText}` +
    `${hoursText}` +
    `${minutesText}` +
    `${secondsText}`
  ).trim();
}

function getTimeUntil(from: Dayjs, to: Dayjs): string {
  const days = to.diff(from, "d");
  const hours = to.diff(from, "h");
  const minutes = to.diff(from, "m") - hours * 60;
  const seconds = to.diff(from, "s") - to.diff(from, "m") * 60;

  const daysText = days > 0 ? `${days}d ` : ``;
  const hoursText =
    hours > 0 ? `${padIfNotLeading(hours - days * 24, days === 0)}h ` : ``;
  const minutesText =
    minutes > 0 ? `${padIfNotLeading(minutes, hours === 0)}m ` : ``;
  const secondsText =
    seconds > 0 ? `${padIfNotLeading(seconds, minutes === 0)}s` : ``;

  return (
    `${daysText}` +
    `${hoursText}` +
    `${minutesText}` +
    `${secondsText}`
  ).trim();
}

function checkPermission(
  permission: string,
  channel: Channel,
  zephyr: Zephyr
): boolean {
  if (channel.type !== 0) return false;
  return (<TextChannel>channel).permissionsOf(zephyr.user.id).json[permission];
}

export { padIfNotLeading, getTimeUntilNextDay, checkPermission, getTimeUntil };
