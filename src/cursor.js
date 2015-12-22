/* @flow */
import promisify from 'nodefunc-promisify';
import NeDB from 'nedb-isotropy';

import type {
    AsyncAction, AsyncAction1, AsyncAction2, AsyncAction3, AsyncAction4, AsyncAction5, AsyncAction6,
    AsyncFunc, AsyncFunc1, AsyncFunc2, AsyncFunc3, AsyncFunc4, AsyncFunc5, AsyncFunc6
} from 'nodefunc-promisify';

const _exec: AsyncFunc<Array<Object>> = promisify(NeDB.Cursor.prototype.exec);
const _limit = NeDB.Cursor.prototype.limit;
const _skip = NeDB.Cursor.prototype.skip;
const _sort = NeDB.Cursor.prototype.sort;

class Cursor {
    underlying: NeDB.Cursor;
    counter: number;
    _resultsLoaded: boolean;
    _results: Array<Object>;
    _counter: number;

    constructor(underlying: NeDB.Cursor) {
        this.underlying = underlying;
        this._reset();
    }

    async toArray() : Promise<Array<Object>> {
        this._reset();
        return await _exec.call(this.underlying);
    }

    async count() : Promise<number> {
        this._reset();
        const results = await this.toArray();
        return results.length;
    }

    async hasNext() : Promise<boolean> {
        if (!this._resultsLoaded) {
            this._results = await this.toArray();
        }
        return this._counter < this._results.length;
    }

    limit(n: number) : Cursor {
        this._reset();
        const cursor = _limit.call(this.underlying, n);
        return new Cursor(cursor);
    }

    async next() : Promise<Object> {
        if (!this._resultsLoaded) {
            this._results = await this.toArray();
        }
        const result = this._results[this._counter];
        this._counter++;
        return result;
    }

    skip(n: number) : Cursor {
        this._reset();
        const cursor = _skip.call(this.underlying, n);
        return new Cursor(cursor);
    }

    sort(keys: Array<Array<string|number>>) : Cursor {
        this._reset();
        const sortParams = {};
        keys.forEach(k => {
            sortParams[k[0]] = k[1];
        });
        const cursor = _sort.call(this.underlying, sortParams);
        return new Cursor(cursor);
    }

    _reset() : void {
        this._resultsLoaded = false;
        this._results = [];
        this._counter = 0;
    }
}

export default Cursor;
