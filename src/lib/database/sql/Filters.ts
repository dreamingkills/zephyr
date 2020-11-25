import { DB } from "..";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static parseOptions(options: Filter): string[] {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      switch (prop) {
        case "issue": {
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
        case "name": {
          queryOptions.push(
            ` (alphanum(card_base.individual_name)) LIKE CONCAT("%",alphanum(${DB.connection.escape(
              value
            )}),"%")`
          );
          break;
        }
        case "group": {
          queryOptions.push(
            ` (alphanum(card_base.group_name)) LIKE CONCAT("%",alphanum(${DB.connection.escape(
              value
            )}),"%")`
          );
          break;
        }
      }
    }
    return queryOptions;
  }
}
