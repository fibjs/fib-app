/// <reference types="@fxjs/orm" />

import { err_info } from '../utils/err_info';
import _find = require('../utils/find');

import { filter, filter_ext } from '../utils/filter';
import { _get } from '../utils/get';
import { checkout_acl } from '../utils/checkout_acl';
import ormUtils = require('../utils/orm');
import { getInstanceOneAssociation } from '../utils/orm-assoc';

export function setup (app: FibApp.FibAppClass) {
    const api = app.api;

    api.post = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, data: FibApp.FibAppReqData) => {
        var acl = checkout_acl(req.session, 'create', cls.ACL) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, {}, cls.cid);
        
        var spec_keys = {
            createdBy: ormUtils.getCreatedByField(orm.settings),
        }
        var _createBy = cls.extends[spec_keys['createdBy']];
        var _opt;
        var rdata = [];
        var obj;

        let delr = !orm.settings.get(`rest.model.${cls.model_name}.extend.keep_association_beforewrite`)
        function _create(d) {
            d = filter(d, acl);

            var rd = {};
            for (var k in cls.extends) {
                var r = d[k];

                if (r !== undefined) {
                    rd[k] = r;
                    if (delr)
                        delete d[k];
                }
            }

            rdata.push(rd);

            var o: FxOrmNS.Instance = new cls(d);
            if (_createBy !== undefined) {
                _opt = Object.keys(getInstanceOneAssociation(o, spec_keys['createdBy']).field)[0];
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
                var res = api.epost(req, orm, cls, obj[i], k, rd[k]);
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

    api.get = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        var obj: FibApp.FibAppInternalCommObj = _get(cls, id, req.session, 'read');
        if (obj.error)
            return obj;

        return {
            success: filter(filter_ext(req.session, obj.data), req.query.keys, obj.acl)
        };
    };

    api.put = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, data: FibApp.FibAppReqData): FibApp.FibAppApiFunctionResponse => {
        var obj = _get(cls, id, req.session, 'write');
        if (obj.error)
            return obj;

        data = filter(data, obj.acl as FibAppACL.AclPermissionType__Write);

        var rdata = {};

        let delr = !orm.settings.get(`rest.model.${cls.model_name}.extend.keep_association_beforewrite`)
        for (var k in cls.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                if (delr)
                    delete data[k];
            }
        }

        for (var k in data)
            obj.data[k] = data[k];

        obj.data.saveSync();

        return {
            success: {
                id: obj.data.id,
                createdBy: obj.data[ormUtils.getCreatedByField(orm.settings)]
            }
        };
    };

    api.del = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        var obj = _get(cls, id, req.session, 'delete');
        if (obj.error)
            return obj;

        obj.data.removeSync();

        return {
            success: {
                id: obj.data.id
            }
        };
    };

    api.find = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel): FibApp.FibAppApiFunctionResponse => {
        if (!checkout_acl(req.session, 'find', cls.ACL))
            return err_info(4030001, {}, cls.cid);

        return {
            success: _find(req, cls.find())
        };
    };
}
