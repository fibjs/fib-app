import { err_info } from '../utils/err_info';

import { _get } from '../utils/get';
import { checkout_acl } from '../utils/checkout_acl';
import { FibApp } from '../Typo/app';

export function setup (app: FibApp.FibAppClass) {
    const api = app.api;

    api.functionHandler = function (classname: string, func: string) {
        return function (_req: FibApp.FibAppReq, db: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, data: FibApp.FibDataPayload) {
            if (!checkout_acl(_req.session, func, cls.ACL))
                return err_info(4030001, {classname: cls.model_name}, cls.cid);

            const f: FibApp.FibAppOrmModelFunction = cls.functions[func];
            if (f === undefined)
                return err_info(4040004, {
                    function: func,
                    classname: classname
                }, cls.cid);

            try {
                return f(_req, data);
            } catch (e) {
                if (!app.__opts.hideErrorStack)
                    console.error(e.stack);
                return err_info(5000002, {
                    function: func,
                    classname: classname,
                    message: e.message
                }, cls.cid);
            }
        }
    }
}
