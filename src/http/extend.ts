import _find = require('../utils/find');
import { err_info } from '../utils/err_info';
import util = require('util');
import { checkout_obj_acl } from '../utils/checkout_acl';
import { filter, filter_ext } from '../utils/filter';
import { _get, _eget } from '../utils/get';
import ormUtils = require('../utils/orm');
import { getInstanceManyAssociation, getInstanceOneAssociation, check_hasmany_extend_extraprops } from '../utils/orm-assoc';

export function setup (app: FibApp.FibAppClass) {
    var api = app.api;

    api.eput = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var robj = _eget(cls, id, extend, rid, req.session, "write");
        if (robj.error)
            return robj;

        data = filter(data, robj.acl as FibAppACL.AclPermissionType__Write);

        var rdata = {};

        let delrr = !orm.settings.get(`rest.model.${rel_model.model.model_name}.extend.keep_association_beforewrite`)
        for (var k in rel_model.model.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                if (delrr)
                    delete data[k];
            }
        }

        for (var k in data)
            robj.data[k] = data[k];

        robj.data.saveSync();

        return {
            success: {
                id: robj.data.id,
                updatedAt: robj.data.updatedAt
            }
        };
    };

    api.elink = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.FibDataPayload): FibApp.FibAppApiFunctionResponse => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "write");
        if (obj.error)
            return obj;

        if (Array.isArray(obj.acl) && obj.acl.indexOf(extend) === -1)
            return err_info(4030001, {}, cls.cid);

        var rid = data.id;
        if (rid === undefined)
            return err_info(4040002, {
                id: rid,
                classname: extend
            }, rel_model.model.cid);

        var robj = _get(rel_model.model, rid, req.session, "read");
        if (robj.error)
            return robj;

        var _opt;
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
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj: FibApp.AppInternalCommunicationObj;

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

        var acl = checkout_obj_acl(req.session, 'create', obj.data, extend) as FibAppACL.AclPermissionType__Create;
        if (!acl)
            return err_info(4030001, {}, cls.cid);

        var spec_keys = {
            createdBy: ormUtils.getCreatedByField(orm.settings),
        }
        var _createBy = rel_model.model.extends[spec_keys['createdBy']];
        var _opt;
        var robj;
        var rdata = [];

        function _create(d) {
            d = filter(d, acl);

            // if (d.extra) {
            //     console.log('there is extra', d.extra)
            //     var many_assoc = check_hasmany_extend_extraprops(obj.data.model(), extend)
            //     if (many_assoc) {
            //         console.log('there is many_assoc',
            //             many_assoc,
            //             obj.data[many_assoc.addAccessor],
            //             obj.data[many_assoc.addAccessor + 'Sync'],
            //         )
            //     }
            // }

            var rd = {};

            let delr = !orm.settings.get(`rest.model.${cls.model_name}.extend.keep_association_beforewrite`)
            for (var k in cls.extends) {
                var r = d[k];

                if (r !== undefined) {
                    rd[k] = r;
                    if (delr)
                        delete d[k];
                }
            }
            rdata.push(rd);

            var ro = new rel_model.model(d);

            if (_createBy !== undefined) {
                _opt = Object.keys(getInstanceOneAssociation(ro, spec_keys['createdBy']).field)[0];
                ro[_opt] = req.session.id;
            }

            if (rel_model.reversed) {
                obj.data[extend] = ro;
                obj.data.saveSync();
            } else
                ro.saveSync();

            return ro;
        }

        if (Array.isArray(data))
            robj = data.map(d => _create(d));
        else
            robj = [_create(data)];

        rdata.forEach((rd, i) => {
            for (var k in rd) {
                var res = api.epost(req, orm, cls, robj[i], k, rd[k]);
                if (res.error)
                    return res;
            }
        });

        if (!rel_model.reversed) {
            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = getInstanceOneAssociation(obj.data, extend).setAccessor;
            else
                _opt = getInstanceManyAssociation(obj.data, extend).addAccessor;

            robj.forEach(ro => obj.data[_opt + 'Sync'].call(obj.data, ro));
        }

        if (Array.isArray(data)) {
            return {
                status: 201,
                success: robj.map(o => {
                    return {
                        id: o.id,
                        createdAt: o.createdAt
                    };
                })
            };
        } else
            return {
                status: 201,
                success: {
                    id: robj[0].id,
                    createdAt: robj[0].createdAt
                }
            };
    };

    api.efind = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType): FibApp.FibAppApiFunctionResponse => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (rel_model.type === 'hasOne' && !rel_model.reversed)
            return api.eget(req, orm, cls, id as FibApp.AppIdType, extend);

        var obj;

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
            return err_info(4030001, {}, rel_model.model.cid);

        var _association;
        if (rel_model.type === 'hasOne')
            _association = getInstanceOneAssociation(obj.data, extend);
        else
            _association = getInstanceManyAssociation(obj.data, extend);

        return {
            success: _find(req, obj.data[_association.getAccessor].call(obj.data), obj.data, extend)
        };
    };

    api.eget = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        var robj = _eget(cls, id, extend, rid, req.session, "read");
        if (robj.error)
            return robj;

        return {
            success: filter(filter_ext(req.session, robj.data), req.query.keys, robj.acl)
        };
    };

    api.edel = (req: FibApp.FibAppReq, orm: FibApp.FibAppDb, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType): FibApp.FibAppApiFunctionResponse => {
        var robj = _eget(cls, id, extend, rid, req.session, "delete");
        if (robj.error)
            return robj;

        var rel_model = cls.extends[extend];

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
