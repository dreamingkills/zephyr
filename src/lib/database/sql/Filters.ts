import { DB } from "..";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static parseOptions(options: Filter): string[] {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      switch (prop) {
        case "serial": {
          if (value.toString().startsWith(">")) {
            queryOptions.push(
              ` user_card.serial_number>${DB.connection.escape(
                value.toString().slice(1)
              )}`
            );
          } else if (value.toString().startsWith("<")) {
            queryOptions.push(
              ` user_card.serial_number<${DB.connection.escape(
                value.toString().slice(1)
              )}`
            );
          } else
            queryOptions.push(
              ` user_card.serial_number=${DB.connection.escape(
                parseInt(value as string)
              )}`
            );
          break;
        }
      }
    }
    return queryOptions;
  }
}
