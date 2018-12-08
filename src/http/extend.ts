import _find = require('../utils/find');
import { err_info } from '../utils/err_info';
import util = require('util');

import { checkout_obj_acl } from '../utils/checkout_acl';
import { filter, filter_ext } from '../utils/filter';
import { _get, _eget, _egetx } from '../utils/get';
import ormUtils = require('../utils/orm');
import { getInstanceManyAssociation, getInstanceOneAssociation, check_hasmany_extend_extraprops, extra_save } from '../utils/orm-assoc';

function map_ro_result (ro) {
    return {
        id: ro.id,
        createdAt: ro.createdAt
    };
}

export function setup (app: FibApp.FibAppClass) {
    const api = app.api;

    api.eput = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        const { riobj, iobj } = _egetx(cls, id, extend, rid, req.session, "write");
        if (riobj.error)
            return riobj;

        data = filter(data, riobj.acl as FibAppACL.AclPermissionType__Write);

        const rextdata = {};

        let delrr = !orm.settings.get(`rest.model.keep_association.eput:${cls.model_name}-${extend}`)
        for (const k in rel_model.model.extends) {
            if (data[k] !== undefined) {
                rextdata[k] = data[k];
                if (delrr)
                    delete data[k];
            }
        }

        for (const k in data)
            riobj.data[k] = data[k];

        riobj.data.saveSync();

        if (data.extra && util.isObject(data.extra)) {
            const many_assoc = check_hasmany_extend_extraprops(iobj.data, extend)
            if (many_assoc) {
                extra_save(iobj.data, riobj.data, many_assoc, data.extra, true)
            }
        }

        return {
            success: {
                id: riobj.data.id,
                updatedAt: riobj.data.updatedAt
            }
        };
    };

    api.elink = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        const obj = _get(cls, id, req.session, "write");
        if (obj.error)
            return obj;

        if (Array.isArray(obj.acl) && obj.acl.indexOf(extend) === -1)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);

        const rid = data.id;
        if (rid === undefined)
            return err_info(4040002, {
                id: rid,
                classname: extend
            }, rel_model.model.cid);

        const robj = _get(rel_model.model, rid, req.session, "read");
        if (robj.error)
            return robj;

        let _opt;
        switch (rel_model.type) {
            case 'hasOne':
                _opt = getInstanceOneAssociation(obj.data, extend).setAccessor;
                break
            case 'hasMany':
            default:
                _opt = getInstanceManyAssociation(obj.data, extend).addAccessor;
                break
        }

        obj.data[_opt + 'Sync'].call(obj.data, robj.data);

        return {
            success: {
                id: obj.data.id,
                updatedAt: obj.data.updatedAt
            }
        };
    };

    api.epost = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        let obj: FibApp.AppInternalCommunicationObj;

        if (util.isObject(id)) {
            obj = {
                data: id
            } as any;
            id = (id as FibApp.ObjectWithIdField).id;
        } else {
            obj = _get(cls, id as FibApp.AppIdType, req.session);
            if (obj.error)
                return obj as FibApp.FibAppApiFunctionResponse;
        }

        const acl = checkout_obj_acl(req.session, 'create', obj.data, extend) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);

        const spec_keys = {
            createdBy: ormUtils.getCreatedByField(orm.settings),
        }
        const _createBy = rel_model.model.extends[spec_keys['createdBy']];
        let _opt;
        let ros = [];
        const rextdata_list = [];
        const rextdata_extras = [];

        function _create(d) {
            d = filter(d, acl);

            const r_ext_d: any = {};

            let delr = !orm.settings.get(`rest.model.keep_association.epost:${cls.model_name}-${extend}`)
            for (const k in cls.extends) {
                if (d[k] !== undefined) {
                    r_ext_d[k] = d[k];
                    if (delr)
                        delete d[k];
                }
            }
            rextdata_list.push(r_ext_d)
            
            const extra_many_assoc = check_hasmany_extend_extraprops(obj.data, extend) || null
            rextdata_extras.push({ extra_many_assoc, extra: d.extra || null })
            delete d.extra

            const ro = new rel_model.model(d);

            if (_createBy !== undefined) {
                _opt = Object.keys(getInstanceOneAssociation(ro, spec_keys['createdBy']).field)[0];
                ro[_opt] = req.session.id;
            }

            if (rel_model.reversed) {
                obj.data[extend] = ro;
                obj.data.saveSync();
            } else {
                ro.saveSync();
            }

            return ro
        }

        if (Array.isArray(data))
            ros = data.map(d => _create(d));
        else
            ros = [_create(data)];
        
        rextdata_list.forEach((rdata, i) => {
            for (const k in rdata) {
                const res = api.epost(req, orm, cls, ros[i], k, rdata[k]);
                // only capture the 1st error emitted
                if (res.error) {
                    return res;
                }
            }
        })

        if (!rel_model.reversed) {
            let _opt, assoc
            if (rel_model.type === 'hasOne') {
                assoc = getInstanceOneAssociation(obj.data, extend)
                _opt = assoc.setAccessor;
            } else  {
                assoc = getInstanceManyAssociation(obj.data, extend)
                _opt = assoc.addAccessor;
            }
            
            for (const i in ros) {
                const ro = ros[i]
                if (assoc === rextdata_extras[i].extra_many_assoc) {
                    if (rextdata_extras[i].extra)
                        extra_save(obj.data, ro, rextdata_extras[i].extra_many_assoc, rextdata_extras[i].extra)
                    else
                        return err_info(4040005, {
                            classname: cls.model_name,
                            extend: extend
                        });
                } else
                {
                    // console.log('Object.keys(assoc)', Object.keys(assoc), ro.extra)
                    // rextdata_extras[i].extra_many_assoc && console.log('Object.keys(rextdata_extras[i].extra_many_assoc)', 
                    //     Object.keys(rextdata_extras[i].extra_many_assoc),
                    // )
                    
                    obj.data[_opt + 'Sync'](ro)
                }
            }
        }

        return {
            status: 201,
            success: Array.isArray(data) ? ros.map(map_ro_result) : ros.map(map_ro_result)[0]
        };
    };

    api.efind = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType): FibApp.FibAppApiFunctionResponse => {
        const rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (rel_model.type === 'hasOne' && !rel_model.reversed)
            return api.eget(req, orm, cls, id as FibApp.AppIdType, extend);

        let obj;

        if (util.isObject(id)) {
            obj = {
                data: id
            };
            id = (id as FibApp.ObjectWithIdField).id;
        } else {
            obj = _get(cls, id as FibApp.AppIdType, req.session);
            if (obj.error)
                return obj;
        }

        if (!checkout_obj_acl(req.session, 'find', obj.data, extend))
            return err_info(4030001, {classname: cls.model_name}, rel_model.model.cid);

        let _association;
        if (rel_model.type === 'hasOne')
            _association = getInstanceOneAssociation(obj.data, extend);
        else
            _association = getInstanceManyAssociation(obj.data, extend);

        return {
            success: _find(req, obj.data[_association.getAccessor].call(obj.data), obj.data, extend)
        };
    };

    api.eget = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const robj = _eget(cls, id, extend, rid, req.session, "read");
        if (robj.error)
            return robj;

        return {
            success: filter(filter_ext(req.session, robj.data), req.query.keys, robj.acl)
        };
    };

    api.edel = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const robj = _eget(cls, id, extend, rid, req.session, "delete");
        if (robj.error)
            return robj;

        const rel_model = cls.extends[extend];

        if (rel_model.type === 'hasMany') {
            robj.base[getInstanceManyAssociation(robj.base, extend).delAccessor + 'Sync'].call(robj.base, robj.data);

            return {
                success: {
                    id: robj.base.id,
                    updatedAt: robj.base.updatedAt
                }
            };
        }

        if (rel_model.type === 'hasOne') {
            if (rel_model.reversed)
                return err_info(4040003, {
                    extend: extend,
                    classname: rel_model.model.model_name
                }, rel_model.model.cid);

            robj.base[getInstanceOneAssociation(robj.base, extend).delAccessor + 'Sync'].call(robj.base);

            return {
                success: {
                    id: robj.base.id,
                    updatedAt: robj.base.updatedAt
                }
            };
        }
    };
};
