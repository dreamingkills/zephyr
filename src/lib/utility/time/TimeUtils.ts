import dayjs from "dayjs";

export function getCurrentTimestamp(): string {
  return dayjs().format(`YYYY/MM/DD HH:mm:ss`);
}
