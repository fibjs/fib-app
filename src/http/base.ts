/// <reference types="@fxjs/orm" />

import { err_info } from '../utils/err_info';
import _find = require('../utils/find');

import { filter, filter_ext } from '../utils/filter';
import { _get } from '../utils/get';
import { checkout_acl } from '../utils/checkout_acl';
import ormUtils = require('../utils/orm');
import { getInstanceOneAssociation } from '../utils/orm-assoc';

function map_ro_result (ro) {
    return {
        id: ro.id,
        createdAt: ro.createdAt
    };
}

export function setup (app: FibApp.FibAppClass) {
    const api = app.api;

    api.post = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, data: FibApp.FibAppReqData) => {
        const acl = checkout_acl(req.session, 'create', cls.ACL) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);
        
        const spec_keys = {
            createdBy: ormUtils.getCreatedByField(orm.settings),
        }
        const _createBy = cls.extends[spec_keys['createdBy']];
        let _opt;
        let instances = [];
        const extdata_list = [];

        let delr = !orm.settings.get(`rest.model.keep_association.post.${cls.model_name}`)
        function _create(d) {
            d = filter(d, acl);

            const ext_d = {};
            for (const k in cls.extends) {
                if (d[k] !== undefined) {
                    ext_d[k] = d[k];
                    if (delr)
                        delete d[k];
                }
            }
            extdata_list.push(ext_d);

            const o: FxOrmNS.Instance = new cls(d);
            if (_createBy !== undefined) {
                _opt = Object.keys(getInstanceOneAssociation(o, spec_keys['createdBy']).field)[0];
                o[_opt] = req.session.id;
            }
            o.saveSync();

            return o
        }

        if (Array.isArray(data))
            instances = data.map(d => _create(d));
        else
            instances = [_create(data)];
        
        // if not delr in previous step, `o.saveSync` would do associatation operation automatically.
        delr && extdata_list.forEach((extdata, i) => {
            for (const k in extdata) {
                const res = api.epost(req, orm, cls, instances[i], k, extdata[k]);
                // only capture the 1st error emitted
                if (res.error) {
                    return res;
                }
            }
        })

        return {
            status: 201,
            success: Array.isArray(data) ? instances.map(map_ro_result) : instances.map(map_ro_result)[0]
        };
    };

    api.get = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const obj: FibApp.FibAppInternalCommObj = _get(cls, id, req.session, 'read');
        if (obj.error)
            return obj;

        return {
            success: filter(filter_ext(req.session, obj.inst), req.query.keys, obj.acl)
        };
    };

    api.put = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, data: FibApp.FibAppReqData): FibApp.FibAppApiFunctionResponse => {
        const obj = _get(cls, id, req.session, 'write');
        if (obj.error)
            return obj;

        data = filter(data, obj.acl as FibAppACL.AclPermissionType__Write);

        const rdata = {};

        let delr = !orm.settings.get(`rest.model.keep_association.put.${cls.model_name}`)
        for (const k in cls.extends) {
            const r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                if (delr)
                    delete data[k];
            }
        }

        for (const k in data)
            obj.inst[k] = data[k];

        obj.inst.saveSync();

        return {
            success: {
                id: obj.inst.id,
                createdBy: obj.inst[ormUtils.getCreatedByField(orm.settings)]
            }
        };
    };

    api.del = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const obj = _get(cls, id, req.session, 'delete');
        if (obj.error)
            return obj;

        obj.inst.removeSync();

        return {
            success: {
                id: obj.inst.id
            }
        };
    };

    api.find = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel): FibApp.FibAppApiFunctionResponse => {
        if (!checkout_acl(req.session, 'find', cls.ACL))
            return err_info(4030001, {classname: cls.model_name}, cls.cid);

        return {
            success: _find(req, cls.find())
        };
    };
}
