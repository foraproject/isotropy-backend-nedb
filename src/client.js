/* @flow */
import Db from "./db";

class Client {
  static async connect(connectionString: string) : Promise<Db> {
    return new Db();
  }
}

export default Client;
