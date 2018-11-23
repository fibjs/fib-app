/// <reference path="../../@types/index.d.ts" />

import util = require('util');
import { err_info } from '../utils/err_info';
import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';

export const _get = function (cls: FxOrmNS.FibOrmFixedModel, id: FibApp.AppIdType, session: FibApp.FibAppSession, act?: FibAppACL.ACLActString): FibApp.FibAppInternalCommObj {
    var obj: FibApp.FibAppInternalCommObj = {
        data: (cls as any).find().where({
            id: id
        }).firstSync()
    };

    if (obj.data === null)
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);

    if (act) {
        var acl = checkout_obj_acl(session, act, obj.data);
        if (!acl)
            return err_info(4030001, {}, cls.cid);
        obj.acl = acl;
    }

    return obj;
};

export const _eget = function (cls: FxOrmNS.FibOrmFixedModel, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): FibApp.FibAppInternalCommExtendObj {
    var rel_model = cls.extends[extend];
    if (rel_model === undefined)
        return err_info(4040001, {
            classname: extend
        }, cls.cid);

    var obj;

    if (util.isObject(id)) {
        obj = {
            data: id
        };
        id = (id as any).id;
    } else {
        obj = {
            data: (cls as any).find().where({
                id: id
            }).firstSync()
        };

        if (obj.data === null)
            return err_info(4040002, {
                id: id,
                classname: cls.model_name
            }, cls.cid);
    }

    var __opt;

    if (rel_model.type === 'hasOne') {
        if (rel_model.reversed)
            __opt = obj.data[obj.data.__opts.one_associations.find(a => a.name === extend).getAccessor].call(obj.data);
        else {
            var rid1 = obj.data[Object.keys(obj.data.__opts.one_associations.find(a => a.name === extend).field)[0]];
            if (rid === undefined)
                rid = rid1;
            else if (rid != rid1)
                return err_info(4040002, {
                    id: rid,
                    classname: `${cls.model_name}.${extend}`
                }, rel_model.model.cid);
            __opt = rel_model.model.find();
        }
    } else
        __opt = obj.data[obj.data.__opts.many_associations.find(a => a.name === extend).getAccessor].call(obj.data);

    var robj: FibApp.FibAppInternalCommExtendObj = {
        base: obj.data,
        data: __opt.where({
            id: rid
        }).firstSync()
    };

    if (robj.data === null)
        return err_info(4040002, {
            id: rid,
            classname: `${cls.model_name}.${extend}`
        }, rel_model.model.cid);

    if (act) {
        var acl = checkout_robj_acl(session, act, obj.data, robj.data, extend);
        if (!acl)
            return err_info(4030001, {}, rel_model.model.cid);
        robj.acl = acl;
    }

    return robj;
};
