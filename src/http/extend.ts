import util = require('util');
import ORM = require('@fxjs/orm');
const Helpers = ORM.Helpers;

import _find = require('../utils/find');
import { err_info } from '../utils/err_info';
import ormUtils = require('../utils/orm');

import { checkout_obj_acl } from '../utils/checkout_acl';
import { filter, filter_ext } from '../utils/filter';
import { _get, _eget, _egetx } from '../utils/get';

import { check_hasmanyassoc_with_extraprops, extra_save, shouldSetSingle, getOneMergeIdFromAssocHasOne, getAccessorForPost, execLinkers, addHiddenLazyLinker__AfterSave, getValidDataFieldsFromModel, addHiddenProperty, safeUpdateHasManyAssociatedInstanceWithExtra, buildCleanInstance, addHiddenLazyLinker__BeforeSave } from '../utils/orm-assoc';
import { is_count_required, found_result_selector } from '../utils/query';
import { filterInstanceAsItsOwnShape, map_to_result } from '../utils/common';

export function setup(app: FibApp.FibAppClass) {
    const api = app.api;

    api.eput = (req, orm, cls, id, extend, rid, data) => {
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

        riobj.inst.saveSync.call(riobj.inst, {}, {saveAssociations: false});

        if (data.extra && util.isObject(data.extra)) {
            riobj.inst['extra'] = data.extra
            const many_assoc = check_hasmanyassoc_with_extraprops(iobj.inst, extend)
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
                _opt = Helpers.getOneAssociationItemFromInstanceByExtname(obj.inst, extend).setAccessor;
                break
            case 'hasMany':
                _opt = Helpers.getManyAssociationItemFromInstanceByExtname(obj.inst, extend).addAccessor;
                break
            default:
                break
        }

        if (!_opt)
            return err_info(4040003, {
                extend: extend,
                classname: cls.model_name,
            }, rel_assoc_info.association.model.cid);

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

        const key_model = rel_assoc_info.association.model;
        const _createBy = key_model.associations[spec_keys['createdBy']];
        let rinstances = [] as FxOrmInstance.Instance[];

        const is_extendsTo = rel_assoc_info.type === 'extendsTo';

        const KEYS_TO_LEFT = getValidDataFieldsFromModel(key_model);
        function _create(d: FxOrmInstance.InstanceDataPayload) {
            d = filter(d, acl);
            // this field has been used in probable parent call to `api.epost` in `api.post`
            const dextra = d.extra
            delete d.extra

            const ro = ormUtils.create_instance_for_internal_api(key_model, {
                data: d,
                req_info: req,
                keys_to_left: KEYS_TO_LEFT
            })
            if (dextra)
                addHiddenProperty(ro, '$extra', dextra);

            const linkers_after_host_save: Function[] = [];

            if (_createBy !== undefined) {
                const _opt = Object.keys(Helpers.getOneAssociationItemFromInstanceByExtname(ro, spec_keys['createdBy']).field)[0];
                ro[_opt] = req.session.id;
            }

            for (const k in key_model.associations) {
                if (d[k] === undefined) {
                    continue ;
                }

                const dkdata = d[k];
                delete d[k];

                const assoc_info = key_model.associations[k];
                const is_assoc_extendsTo = assoc_info.type === 'extendsTo';

                if (!is_assoc_extendsTo) {
                    const res = api.epost(req, orm, key_model, ro, k, dkdata);

                    // capture the 1st error emitted as soon as possible
                    if (res.error)
                        throw new Error(res.error.message);
        
                    ro[k] = filterInstanceAsItsOwnShape(
                        res.success,
                        // (data) => buildShellInstance(assoc_info.association.model, data.id)
                        data => buildCleanInstance(
                            assoc_info.association.model, data,
                            {
                                keys_to_left: getValidDataFieldsFromModel(assoc_info.association.model, false)
                            }
                        )
                    )

                    if (shouldSetSingle(assoc_info)) {
                        ro[`${getOneMergeIdFromAssocHasOne(assoc_info.association)}`] = res.success.id
                    }
                } else {
                    linkers_after_host_save.push(() => {
                        ro[assoc_info.association.setAccessor + 'Sync'].call(ro, dkdata)
                    })
                }
            }
            
            if (ro.$webx_lazy_linkers_before_save)
                execLinkers(ro.$webx_lazy_linkers_before_save, ro);

            if (rel_assoc_info.association.reversed) {
                addHiddenLazyLinker__BeforeSave(obj.inst, [
                    () => {
                        obj.inst[extend] = Array.isArray(data) ? rinstances : rinstances[0];
                        obj.inst.saveSync.call(obj.inst, {}, {saveAssociations: false});
                    }
                ])
            } else if (!is_extendsTo) {
                ro.saveSync.call(ro, {}, {saveAssociations: false});
            }

            if (ro.$webx_lazy_linkers_after_save)
                execLinkers(ro.$webx_lazy_linkers_after_save, ro);

            execLinkers(linkers_after_host_save);

            return ro
        }

        if (Array.isArray(data)) {
            rinstances = data.map(d => _create(d));
        } else {
            rinstances = [_create(data)];
        }

        const isomorphicLinker = (host: FxOrmInstance.Instance) => {
            if (!host.id) {
                return ;
            }

            if (key_model.reversed) {
                return ;
            }

            for (const i in rinstances) {
                const ro = rinstances[i]
                const isMany = rel_assoc_info.type === 'hasMany'

                const askorOptions = {
                    has_associated_instance_in_many: isMany && host[rel_assoc_info.association.hasAccessor + 'Sync'](ro)
                }
                const linkAccessor = getAccessorForPost(rel_assoc_info, host, askorOptions)

                if (isMany && ro.$extra) {
                    const assoc = rel_assoc_info.association as FxOrmAssociation.InstanceAssociationItem_HasMany;
                    safeUpdateHasManyAssociatedInstanceWithExtra(
                        assoc, host, ro, askorOptions.has_associated_instance_in_many
                    )
                } else {
                    host[linkAccessor + 'Sync'](ro)
                }
            }
        }

        if (!obj.inst.id)
            addHiddenLazyLinker__AfterSave(obj.inst, [isomorphicLinker])
        else
            execLinkers([isomorphicLinker], obj.inst);

        return {
            status: 201,
            success: Array.isArray(data) ? rinstances.map(map_to_result) : rinstances.map(map_to_result)[0]
        };
    };

    api.efind = (req, orm, cls, id, extend) => {
        const rel_assoc_info = cls.associations[extend];
        if (rel_assoc_info === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (
            (rel_assoc_info.type === 'hasOne' && !rel_assoc_info.association.reversed)
            || rel_assoc_info.type === 'extendsTo'
        )
            return api.eget(req, orm, cls, id, extend);

        let obj: FibApp.FibAppInternalCommObj;

        if (util.isObject(id)) {
            obj = {
                inst: id as FxOrmNS.Instance
            };
        } else {
            obj = _get(cls, id as FibApp.AppIdType, req.session);
            if (obj.error)
                return obj;
        }
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        if (!checkout_obj_acl(req.session, 'find', obj.inst, extend))
            return err_info(4030001, { classname: cls.model_name }, rel_assoc_info.association.model.cid);

        const _association = Helpers.getAssociationItemFromInstanceByExtname(rel_assoc_info.type, obj.inst, extend);

        return {
            success: found_result_selector(
                _find(
                    req,
                    obj.inst[_association.getAccessor].bind(obj.inst),
                    cls,
                    {
                        base_instance: obj.inst,
                        extend_in_rest: extend
                    }
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
                robj.base[Helpers.getExtendsToAssociationItemFromInstanceByExtname(robj.base, extend).delAccessor + 'Sync'].call(robj.base);
                break
            case 'hasOne':
                if (rel_assoc_info.association.reversed)
                    return err_info(4040003, {
                        extend: extend,
                        classname: rel_assoc_info.association.model.model_name
                    }, rel_assoc_info.association.model.cid);

                robj.base[Helpers.getOneAssociationItemFromInstanceByExtname(robj.base, extend).delAccessor + 'Sync'].call(robj.base);
                break
            case 'hasMany': 
                robj.base[Helpers.getManyAssociationItemFromInstanceByExtname(robj.base, extend).delAccessor + 'Sync'].call(robj.base, robj.inst);
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
