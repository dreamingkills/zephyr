import dayjs, { Dayjs } from "dayjs";
import { padIfNotLeading } from "../text/TextUtils";

export function getCurrentTimestamp(): string {
  return dayjs().format(`YYYY/MM/DD HH:mm:ss`);
}

export function getTimeUntil(from: Dayjs, to: Dayjs): string {
  const days = to.diff(from, "d");
  const hours = to.diff(from, "h");
  const minutes = to.diff(from, "m") - hours * 60;
  const seconds = to.diff(from, "s") - to.diff(from, "m") * 60;
  const ms = to.diff(from, "ms") - to.diff(from, "s") * 1000;

  const daysText = days > 0 ? `${days}d ` : ``;
  const hoursText =
    hours > 0 ? `${padIfNotLeading(hours - days * 24, days === 0)}h ` : ``;
  const minutesText =
    minutes > 0 ? `${padIfNotLeading(minutes, hours === 0)}m ` : ``;
  const secondsText =
    seconds > 0 ? `${padIfNotLeading(seconds, minutes === 0)}s` : ``;
  const msText = ms > 0 ? `${padIfNotLeading(ms, seconds === 0)}ms` : ``;

  if (ms === 0 && minutes === 0 && hours === 0 && days === 0) {
    return `Now`;
  } else if (
    ms > 0 &&
    seconds === 0 &&
    minutes === 0 &&
    hours === 0 &&
    days === 0
  ) {
    return msText;
  } else {
    return (
      `${daysText}` +
      `${hoursText}` +
      `${minutesText}` +
      `${secondsText}`
    ).trim();
  }
}

export function getTimeUntilNextDay(timestamp: Dayjs): string {
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
