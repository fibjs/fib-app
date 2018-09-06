const { err_info } = require('../utils/err_info');
import _find = require('../utils/find');

const { filter, filter_ext } = require('../utils/filter');
const { _get } = require('../utils/get');
const { check_acl  } = require('../utils/check_acl');

import { FibAppClass, FibAppReqData, FibAppDb, FibAppSetupChainFn, FibAppHttpRequest, FibAppReq, FibAppInternalCommObj } from '../../@types/app';
import OrmNS from 'orm';
import { FibAppORMModel } from '../../@types/orm-patch';

export const bind = (_: FibAppSetupChainFn, app: FibAppClass) => {
    var api = app.api;

    api.post = (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, data: FibAppReqData) => {
        var acl: ModelACLCheckResult = check_acl(req.session, "create", cls.ACL);
        if (!acl)
            return err_info(4030001, {}, cls.cid);

        var _createBy = cls.extends['createdBy'];
        var _opt;
        var rdata = [];
        var obj;

        function _create(d) {
            d = filter(d, acl);

            var rd = {};
            for (var k in cls.extends) {
                var r = d[k];

                if (r !== undefined) {
                    rd[k] = r;
                    delete d[k];
                }
            }

            rdata.push(rd);

            var o: OrmNS.FibOrmFixedModelInstance = new cls(d);
            if (_createBy !== undefined) {
                _opt = Object.keys(o.__opts.one_associations.find(a => a.name === 'createdBy').field)[0];
                o[_opt] = req.session.id;
            }
            o.saveSync();

            return o;
        }

        if (Array.isArray(data))
            obj = data.map(d => _create(d));
        else
            obj = [_create(data)];

        rdata.forEach((rd, i) => {
            for (var k in rd) {
                var res = api.epost(req, db, cls, obj[i], k, rd[k]);
                if (res.error)
                    return res;
            }
        });

        if (Array.isArray(data))
            return {
                status: 201,
                success: obj.map(o => {
                    return {
                        id: o.id,
                        createdAt: o.createdAt
                    };
                })
            };
        else
            return {
                status: 201,
                success: {
                    id: obj[0].id,
                    createdAt: obj[0].createdAt
                }
            };
    };

    api.get = (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, id: AppIdType): FibAppApiFunctionResponse => {
        var obj: FibAppInternalCommObj = _get(cls, id, req.session, "read");
        if (obj.error)
            return obj;

        return {
            success: filter(filter_ext(req.session, obj.data), req.query.keys, obj.acl)
        };
    };

    api.put = (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, id: AppIdType, data: FibAppReqData): FibAppApiFunctionResponse => {
        var obj = _get(cls, id, req.session, "write");
        if (obj.error)
            return obj;

        data = filter(data, obj.acl);

        var rdata = {};

        for (var k in cls.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                delete data[k];
            }
        }

        for (var k in data)
            obj.data[k] = data[k];

        obj.data.saveSync();

        return {
            success: {
                id: obj.data.id,
                updatedAt: obj.data.updatedAt
            }
        };
    };

    api.del = (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, id: AppIdType): FibAppApiFunctionResponse => {
        var obj = _get(cls, id, req.session, "delete");
        if (obj.error)
            return obj;

        obj.data.removeSync();

        return {
            success: {
                id: obj.data.id
            }
        };
    };

    api.find = (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel): FibAppApiFunctionResponse => {
        if (!check_acl(req.session, "find", cls.ACL))
            return err_info(4030001, {}, cls.cid);

        return {
            success: _find(req, cls.find())
        };
    };

    app.post('/:classname', (req: FibAppHttpRequest, classname: string) => _(req, classname, api.post));
    app.get('/:classname/:id', (req: FibAppHttpRequest, classname: string, id: AppIdType) => _(req, classname, id, api.get));
    app.put('/:classname/:id', (req: FibAppHttpRequest, classname: string, id: AppIdType) => _(req, classname, id, api.put));
    app.del('/:classname/:id', (req: FibAppHttpRequest, classname: string, id: AppIdType) => _(req, classname, id, api.del));
    app.get('/:classname', (req: FibAppHttpRequest, classname: string) => _(req, classname, api.find));
};
