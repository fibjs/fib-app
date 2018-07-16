/// <reference path="../@types/app.d.ts" />

import * as mq from 'mq';
import { FibAppApi, AppDBPool, FibAppDb, FibAppOpts, FibAppClass, FibAppOnTypeString } from '../@types/app';

import classes = require('./classes');
import setupDb = require('./db');
import diagram = require('./utils/diagram');

class App extends mq.Routing implements FibAppClass {
    api: FibAppApi;
    db: AppDBPool<FibAppDb>;
    diagram: any;

    graphqlTypeMap: any;
    
    constructor(url: string, opts: FibAppOpts) {
        super();

        this.graphqlTypeMap = opts.graphqlTypeMap || {}
        this.db = setupDb(this, url, opts);
        classes.bind(this);
        this.diagram = diagram;
    }

    [extraMember: string]: any;
}

export = App;
