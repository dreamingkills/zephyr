import config from "../../../config.json";
import { Pool, createPool, QueryOptions } from "mysql";
import { promisify } from "util";

export class DB {
  public static query: (
    arg1: string | QueryOptions,
    values?: (string | number | boolean | string[] | number[])[]
  ) => Promise<unknown>;
  public static connection: Pool;
  static async connect() {
    const _pool = createPool(config.mariadb);
    const _query = promisify(_pool.query).bind(_pool);
    this.query = _query;
    this.connection = _pool;
  }
}

export class DBClass {}
