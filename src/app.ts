/// <reference path="../@types/app.d.ts" />

import * as mq from 'mq';
import { FibAppApi, AppDBPool, FibAppDb, FibAppOpts, FibAppClass } from '../@types/app';

import classes = require('./classes');
import setupDb = require('./db');
import diagram from './utils/diagram';

class App extends mq.Routing implements FibAppClass {
    api: FibAppApi;
    db: AppDBPool<FibAppDb>;
    diagram: any;
    
    constructor(url: string, opts: FibAppOpts) {
        super();

        this.db = setupDb(this, url, opts);
        classes.bind(this);
        this.diagram = diagram;
    }

    [extraMember: string]: any;
}

module.exports = App;
export = App;
