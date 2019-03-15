import _find = require('../utils/find');
import { err_info } from '../utils/err_info';
import util = require('util');

import { checkout_obj_acl } from '../utils/checkout_acl';
import { filter, filter_ext } from '../utils/filter';
import { _get, _eget, _egetx } from '../utils/get';
import ormUtils = require('../utils/orm');
import { get_many_association_item, get_one_association_item, check_hasmany_extend_extraprops, extra_save, get_extendsto_association_item, get_extendsto_associations, get_association_item_by_reltype } from '../utils/orm-assoc';
import { is_count_required, found_result_selector } from '../utils/query';

function map_ro_result(ro: FxOrmInstance.Instance) {
    return {
        id: ro.id,
        createdAt: ro.createdAt
    };
}

export function setup(app: FibApp.FibAppClass) {
    const api = app.api;

    api.eput = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_assoc_info = cls.associations[extend];
        if (rel_assoc_info === undefined)
            return err_info(4040001, {
                classname: extend
            });

        const { riobj, iobj } = _egetx(cls, id, extend, rid, req.session, "write");

        if (riobj.error)
            return riobj;

        ormUtils.attach_internal_api_requestinfo_to_instance(iobj.inst, { data: null, req_info: req })
        ormUtils.attach_internal_api_requestinfo_to_instance(riobj.inst, { data: null, req_info: req })

        data = filter(data, riobj.acl as FibAppACL.AclPermissionType__Write);

        for (const k in data)
            if (k !== 'extra')
                riobj.inst[k] = data[k];

        riobj.inst.saveSync();

        if (data.extra && util.isObject(data.extra)) {
            riobj.inst['extra'] = data.extra
            const many_assoc = check_hasmany_extend_extraprops(iobj.inst, extend)
            if (many_assoc) {
                extra_save(iobj.inst, riobj.inst, many_assoc, data.extra, true)
            }
        }

        return {
            success: {
                id: riobj.inst.id,
                updatedAt: riobj.inst.updatedAt
            }
        };
    };

    api.elink = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_assoc_info = cls.associations[extend];
        if (rel_assoc_info === undefined)
            return err_info(4040001, {
                classname: extend
            });
        
        if (rel_assoc_info.type === 'extendsTo')
            return api.eput(req, orm, cls, id, extend, undefined, {...data});

        const obj = _get(cls, id, req.session, "write");
        if (obj.error)
            return obj;
            
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        if (Array.isArray(obj.acl) && obj.acl.indexOf(extend) === -1)
            return err_info(4030001, { classname: cls.model_name }, cls.cid);

        const rid = data.id;
        if (rid === undefined)
            return err_info(4040002, {
                id: rid,
                classname: extend
            }, rel_assoc_info.association.model.cid);

        const robj = _get(rel_assoc_info.association.model, rid, req.session, "read");
        if (robj.error)
            return robj;
            
        ormUtils.attach_internal_api_requestinfo_to_instance(robj.inst, { data: null, req_info: req })

        let _opt;
        switch (rel_assoc_info.type) {
            case 'hasOne':
                _opt = get_one_association_item(obj.inst, extend).setAccessor;
                break
            case 'hasMany':
            default:
                _opt = get_many_association_item(obj.inst, extend).addAccessor;
                break
        }

        obj.inst[_opt + 'Sync'].call(obj.inst, robj.inst);

        return {
            success: {
                id: obj.inst.id,
                updatedAt: obj.inst.updatedAt
            }
        };
    };

    api.epost = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        const rel_assoc_info = cls.associations[extend];
        if (rel_assoc_info === undefined)
            return err_info(4040001, {
                classname: extend
            });

        let obj: FibApp.AppInternalCommunicationObj;

        if (util.isObject(id)) {
            obj = {
                inst: id as FxOrmNS.Instance
            } as any;
            id = (id as FibApp.ObjectWithIdField).id;
        } else {
            obj = _get(cls, id as FibApp.AppIdType, req.session);
            if (obj.error)
                return obj as FibApp.FibAppApiFunctionResponse;
        }
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        const acl = checkout_obj_acl(req.session, 'create', obj.inst, extend) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, { classname: cls.model_name }, cls.cid);

        const spec_keys = {
            createdBy: ormUtils.get_field_createdby(orm.settings),
        }

        const is_extendsTo = rel_assoc_info.type === 'extendsTo';
        const extendsToAssoc = is_extendsTo ? get_extendsto_association_item(obj.inst, extend) : null;

        // const key_model = is_extendsTo ? rel_assoc_info.assoc_model : rel_assoc_info.association.model;
        const key_model = rel_assoc_info.association.model;
        const _createBy = key_model.associations[spec_keys['createdBy']];
        let _opt;
        let ros = [];
        const rextdata_extras: {
            extra_many_assoc: FxOrmAssociation.InstanceAssociationItem_HasMany|false,
            extra: any
        }[] = [];

        function _create(d: FxOrmInstance.InstanceDataPayload) {
            d = filter(d, acl);

            const extra_many_assoc = check_hasmany_extend_extraprops(obj.inst, extend) || null
            rextdata_extras.push({ extra_many_assoc, extra: d.extra || null })
            delete d.extra

            let ro = ormUtils.create_instance_for_internal_api(key_model, {
                data: d,
                req_info: req
            })

            if (_createBy !== undefined) {
                _opt = Object.keys(get_one_association_item(ro, spec_keys['createdBy']).field)[0];
                ro[_opt] = req.session.id;
            }

            if (key_model.reversed) {
                obj.inst[extend] = ro;
                obj.inst.saveSync();
            } else if (!is_extendsTo) {
                ro.saveSync();
            } else {
            }

            const r_ext_d: any = {};

            for (const k in key_model.associations) {
                if (d[k] !== undefined) {
                    r_ext_d[k] = d[k];

                    delete d[k];
                }
            }

            Object.keys(r_ext_d).forEach((r_ext, i) => {
                const ext_data = r_ext_d[r_ext]

                const res = api.epost(req, orm, cls, ros[i], r_ext, ext_data);
                // only capture the 1st error emitted as soon as possible
                if (res.error)
                    throw new Error(res.error.message);
            })

            return ro
        }

        if (Array.isArray(data))
            ros = data.map(d => _create(d));
        else
            ros = [_create(data)];

        if (!key_model.reversed) {
            let _opt: string, assoc: FxOrmAssociation.InstanceAssociationItem
            switch (rel_assoc_info.type) {
                default:
                    break
                case 'extendsTo':
                    assoc = extendsToAssoc
                    _opt = assoc.setAccessor;
                    break
                case 'hasOne':
                    assoc = get_one_association_item(obj.inst, extend)
                    _opt = assoc.setAccessor;
                    break
                case 'hasMany':
                    assoc = get_many_association_item(obj.inst, extend)
                    _opt = assoc.addAccessor;
                    break
            }

            for (const i in ros) {
                const ro = ros[i]
                if (assoc === rextdata_extras[i].extra_many_assoc) {
                    if (rextdata_extras[i].extra)
                        extra_save(
                            obj.inst,
                            ro,
                            rextdata_extras[i].extra_many_assoc as FxOrmAssociation.InstanceAssociationItem_HasMany,
                            rextdata_extras[i].extra
                        )
                    else
                        return err_info(4040005, {
                            classname: cls.model_name,
                            extend: extend
                        });
                } else
                    obj.inst[_opt + 'Sync'](ro)
            }
        }

        return {
            status: 201,
            success: Array.isArray(data) ? ros.map(map_ro_result) : ros.map(map_ro_result)[0]
        };
    };

    api.efind = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType): FibApp.FibAppApiFunctionResponse => {
        const rel_assoc_info = cls.associations[extend];
        if (rel_assoc_info === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (
            (rel_assoc_info.type === 'hasOne' && !rel_assoc_info.association.reversed)
            || rel_assoc_info.type === 'extendsTo'
        )
            return api.eget(req, orm, cls, id as FibApp.AppIdType, extend);

        let obj: FibApp.FibAppInternalCommObj;

        if (util.isObject(id)) {
            obj = {
                inst: id as FxOrmNS.Instance
            };
            id = (id as FibApp.ObjectWithIdField).id;
        } else {
            obj = _get(cls, id as FibApp.AppIdType, req.session);
            if (obj.error)
                return obj;
        }
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        if (!checkout_obj_acl(req.session, 'find', obj.inst, extend))
            return err_info(4030001, { classname: cls.model_name }, rel_assoc_info.association.model.cid);

        let _association = get_association_item_by_reltype(rel_assoc_info.type, obj.inst, extend);

        return {
            success: found_result_selector(
                _find(
                    req,
                    obj.inst[_association.getAccessor].call(obj.inst).find(),
                    obj.inst,
                    extend
                ),
                !is_count_required(req.query) ? 'results' : ''
            ) 
        };
    };

    api.eget = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const robj = _eget(cls, id, extend, rid, req.session, "read");

        if (robj.error)
            return robj;
            
        if (!robj.inst)
            return {
                success: null
            }

        ormUtils.attach_internal_api_requestinfo_to_instance(robj.inst, { data: null, req_info: req })

        return {
            success: filter(filter_ext(req.session, robj.inst), req.query.keys, robj.acl)
        };
    };

    api.edel = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const robj = _eget(cls, id, extend, rid, req.session, "delete");
        if (robj.error)
            return robj;
                        
        ormUtils.attach_internal_api_requestinfo_to_instance(robj.inst, { data: null, req_info: req })

        const rel_assoc_info = cls.associations[extend];
        const rel_type = rel_assoc_info.type;

        switch (rel_type) {
            default:
                throw `invalid rel_assoc_info.type ${rel_type}`
            case 'extendsTo': 
                robj.base[get_extendsto_association_item(robj.base, extend).delAccessor + 'Sync'].call(robj.base);
                break
            case 'hasOne':
                if (rel_assoc_info.association.reversed)
                    return err_info(4040003, {
                        extend: extend,
                        classname: rel_assoc_info.association.model.model_name
                    }, rel_assoc_info.association.model.cid);

                robj.base[get_one_association_item(robj.base, extend).delAccessor + 'Sync'].call(robj.base);
                break
            case 'hasMany': 
                robj.base[get_many_association_item(robj.base, extend).delAccessor + 'Sync'].call(robj.base, robj.inst);
                break
        }

        return {
            success: {
                id: robj.base.id,
                updatedAt: robj.base.updatedAt
            }
        };
    };
};
