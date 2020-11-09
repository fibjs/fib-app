import http = require('http')
import mq = require('mq')

import { fill_error, err_info } from "./err_info";
import { is_graphql_request } from './graphql';

import { FibApp } from '../Typo/app';

export function run_batch (app: FibApp.FibAppClass, req: FibApp.FibAppHttpRequest) {
    let querys = [];
    try {
        querys = req.json().requests;
    } catch (e) {
        return fill_error(req, err_info(4000002));
    }
    if (!Array.isArray(querys))
        return fill_error(req, err_info(4000004));

    const results = querys.map(q => {
        const r = new http.Request() as FibApp.FibAppHttpRequest;
        r.method = q.method;

        if (typeof q.headers === 'object' && Object.keys(q.headers).length) {
            r.setHeader(q.headers)
        }

        const a = q.path.split('?');
        r.address = r.value = a[0];
        r.queryString = a[1];

        r.session = req.session;
        if (q.body) {
            if (is_graphql_request(r)) {
                /* support graphql */
                r.write(q.body);
            } else {
                /* default for json format */
                r.json(q.body);
            }
        }
        mq.invoke(app, r);

        const p = r.response;
        if (Math.floor(p.statusCode / 100) !== 2)
            return {
                'error': p.json()
            };
        else
            return {
                'success': p.json()
            };
    });

    req.response.json(results);
}