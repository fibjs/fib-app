import ORM = require('@fxjs/orm');
import { FxOrmInstance } from '@fxjs/orm';

const Helpers = ORM.Helpers;

import { err_info } from '../utils/err_info';
import _find = require('../utils/find');

import { filter, filter_ext } from '../utils/filter';
import { _get } from '../utils/get';
import { checkout_acl } from '../utils/checkout_acl';
import ormUtils = require('../utils/orm');
import { is_count_required, found_result_selector } from '../utils/query';
import { shouldSetSingle, execLinkers, getValidDataFieldsFromModel, getOneMergeIdFromAssocHasOne, buildCleanInstance } from '../utils/orm-assoc';
import { filterInstanceAsItsOwnShape, map_to_result } from '../utils/common';
import { FibApp } from '../Typo/app';
import { FibAppACL } from '../Typo/acl';

export function setup (app: FibApp.FibAppClass) {
    const api = app.api;

    api.post = (req, orm, cls, data) => {
        const acl = checkout_acl(req.session, 'create', cls.ACL) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);
        
        const spec_keys = {
            createdBy: ormUtils.get_field_createdby(orm.settings),
        }
        
        const _createBy = cls.associations[spec_keys['createdBy']];
        let instances = [];

        const KEYS_TO_LEFT = getValidDataFieldsFromModel(cls);
        function _create(d: FxOrmInstance.InstanceDataPayload) {
            d = filter(d, acl);

            let o: FxOrmInstance.Instance = ormUtils.create_instance_for_internal_api(cls, {
                data: d,
                req_info: req,
                keys_to_left: KEYS_TO_LEFT
            })

            if (_createBy !== undefined) {
                const _opt = Object.keys(Helpers.getOneAssociationItemFromInstanceByExtname(o, spec_keys['createdBy']).field)[0];
                o[_opt] = req.session.id;
            }

            const linkers_after_host_save: Function[] = [];

            for (const k in cls.associations) {
                if (d[k] === undefined) {
                    continue ;
                }

                const dkdata = d[k];
                delete d[k];

                const assoc_info = cls.associations[k];
                const is_assoc_extendsTo = assoc_info.type === 'extendsTo';
                
                if (!is_assoc_extendsTo) {
                    const res = api.epost(req, orm, cls, o, k, dkdata);
                    // only capture the 1st error emitted as soon as possible
                    if (res.error)
                        throw new Error(res.error.message);

                    o[k] = filterInstanceAsItsOwnShape(
                        res.success,
                        // data => buildShellInstance(assoc_info.association.model, data.id)
                        data => buildCleanInstance(
                            assoc_info.association.model, data, {
                                keys_to_left: getValidDataFieldsFromModel(assoc_info.association.model, false)
                            }
                        )
                    )

                    if (shouldSetSingle(assoc_info)) {
                        o[`${getOneMergeIdFromAssocHasOne(assoc_info.association)}`] = res.success.id
                    }
                } else {
                    linkers_after_host_save.push(() => {
                        o[assoc_info.association.setSyncAccessor].call(o, dkdata)
                    })
                }
            }

            if (o.$webx_lazy_linkers_before_save)
                execLinkers(o.$webx_lazy_linkers_before_save, o);
            
            o.saveSync.call(o, {}, {saveAssociations: false});
            
            execLinkers(linkers_after_host_save);

            if (o.$webx_lazy_linkers_after_save)
                execLinkers(o.$webx_lazy_linkers_after_save, o);

            return o
        }

        if (Array.isArray(data))
            instances = data.map(d => _create(d));
        else
            instances = [_create(data)];

        return {
            status: 201,
            success: Array.isArray(data) ? instances.map(map_to_result) : instances.map(map_to_result)[0]
        };
    };

    api.get = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const func = parseFibAppOrmModelServices(id, cls.viewServices)

        if (func) {
            req.req_resource_type = 'json'
            return func(req, req.request.query)
        }
        
        const obj: FibApp.FibAppInternalCommObj = _get(cls, id, req.session, 'read');
        if (obj.error)
            return obj;

        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        return {
            success: filter(filter_ext(req.session, obj.inst), req.query.keys, obj.acl)
        };
    };

    api.put = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, data: FibApp.FibAppReqData): FibApp.FibAppApiFunctionResponse => {
        const obj = _get(cls, id, req.session, 'write');
        if (obj.error)
            return obj;
        
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

        data = filter(data, obj.acl as FibAppACL.AclPermissionType__Write);

        const rdata = <FxOrmInstance.InstanceDataPayload>{};

        let delr = !orm.settings.get(`rest.model.keep_association.put.${cls.model_name}`)
        for (const k in cls.associations) {
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
                createdBy: obj.inst[ormUtils.get_field_createdby(orm.settings)]
            }
        };
    };

    api.del = (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        const obj = _get(cls, id, req.session, 'delete');
        if (obj.error)
            return obj;
            
        ormUtils.attach_internal_api_requestinfo_to_instance(obj.inst, { data: null, req_info: req })

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
            success: found_result_selector(
                _find(req, cls.find.bind(cls), cls),
                !is_count_required(req.query) ? 'results' : ''
            )
        }
    };
}

function parseFibAppOrmModelServices (cb_name: string | number, services: FibApp.FibAppOrmModelViewServiceHash): FibApp.FibAppOrmModelViewServiceCallback {
    if (services[cb_name] === undefined || typeof services[cb_name] === 'symbol')
        return null

    if (typeof services[cb_name] !== 'function') {
        let response: any = undefined
        try {
            response = JSON.parse(
                JSON.stringify(services[cb_name])
            )
        } catch (e) {
            services[cb_name] = () => ({error: e})
        }

        // static response
        services[cb_name] = () => ({success: response})
    }

    return services[cb_name]
}