/* @flow */
export type CountOptionsType = {
  limit?: number;
  skip?: number
};

export type FindOneOptionsType = {
  limit?: number,
  sort?: Array<Object> | Object,
  fields?: Object,
  skip?: number
}

import type {
  AsyncAction, AsyncAction1, AsyncAction2, AsyncAction3, AsyncAction4, AsyncAction5, AsyncAction6,
  AsyncFunc, AsyncFunc1, AsyncFunc2, AsyncFunc3, AsyncFunc4, AsyncFunc5, AsyncFunc6
} from 'nodefunc-promisify';

import promisify from 'nodefunc-promisify';
import NeDB from "nedb-isotropy";
import Cursor from "./cursor";

const _count: AsyncFunc1<Object, number> = promisify(NeDB.Datastore.prototype.count);
const _insert: AsyncFunc1<Array<Object>, Array<{_id: Object}>> = promisify(NeDB.Datastore.prototype.insert);
const _find = NeDB.Datastore.prototype.find;
const _remove: AsyncFunc2<Object, { multi: boolean }, number> = promisify(NeDB.Datastore.prototype.remove);
const _update: AsyncFunc3<Object, Object, { multi: boolean }, number> = promisify(NeDB.Datastore.prototype.update);

class Collection {
  underlying: NeDB.Datastore;

  constructor(underlying: NeDB.Datastore) {
    this.underlying = underlying;
  }

  async count(query: Object, options: CountOptionsType = {}) : Promise<number> {
    let { limit, skip } = options;
    limit = limit || 1000000000;
    skip = skip || 0;
    const result = await _count.call(this.underlying, query);
    if (result > limit) {
      return limit;
    } else {
      return result - skip;
    }
  }

  async createIndex(field: Object) : Promise {
    //We are going to create a simple index..
    //Doesn't support multiple fields in the index.
    for (const key in field) {
      await this.underlying.ensureIndex({ fieldName: key });
    }
  }

  async deleteOne(filter: Object) : Promise {
    await _remove.call(this.underlying, filter, { multi: false });
  }

  async deleteMany(filter: Object) : Promise<number> {
    const affected = await _remove.call(this.underlying, filter, { multi: true });
    return affected;
  }

  async dropIndex(name: string) : Promise {
    const parts = name.split("_");
    if (parts.length <= 2) {
      delete this.underlying.indexes[parts[0]];
    }
  }

  async drop() : Promise<Collection> {
    this.underlying = new NeDB.Datastore();
    return this;
  }

  async dropIndexes() : Promise {
    const toDelete = Object.keys(this.underlying.indexes).filter(k => k !== "_id");
    for (const key of toDelete) {
      delete this.underlying.indexes[key];
    }
  }

  find(query: Object, fields: Object) : Cursor {
    const cursor = _find.call(this.underlying, query, fields);
    return new Cursor(cursor);
  }

  async indexes(indexes: Object) : Promise<Array<Object>> {
    return Object.keys(this.underlying.indexes).map(k => {
      const key = {};
      key[k] = 1;
      return {
        key,
        name: `${k}_1`
      };
    });
  }

  async insertOne(doc: Object) : Promise<string> {
    const result = await this.insertMany([doc]);
    return result[0];
  }

  async insertMany(docs: Array<Object>) : Promise<Array<string>> {
    const result = await _insert.call(this.underlying, docs);
    return result.map(i => i._id.toString());
  }

  async updateOne(selector: Object, update: Object) : Promise {
    await _update.call(this.underlying, selector, update, { multi: false });
  }

  async updateMany(selector: Object, update: Object) : Promise<number> {
    const affected = await _update.call(this.underlying, selector, update, { multi: true });
    return affected;
  }
}

export default Collection;
