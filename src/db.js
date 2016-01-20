/* @flow */
import promisify from 'nodefunc-promisify';
import NeDB from "nedb-isotropy";
import Collection from "./collection";

class Db {
  collections: { [key: string]: Collection };

  constructor() {
    this.collections = {};
  }

  collection(name: string) : Collection {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(new NeDB.Datastore());
    }
    return this.collections[name];
  }

  async dropDatabase() : Promise {
    this.collections = {};
  }

  async close() : Promise {
    //NOOP
  }
}

export default Db;
