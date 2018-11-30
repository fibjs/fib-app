/// <reference path="../../@types/index.d.ts" />

import util = require('util');
import { err_info } from '../utils/err_info';
import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';

export const _get = function (cls: FxOrmNS.Model, id: FibApp.AppIdType, session: FibApp.FibAppSession, act?: FibAppACL.ACLActString): FibApp.FibAppInternalCommObj {
    var iobj: FibApp.FibAppInternalCommObj = {
        data: (cls as any).find().where({
            id: id
        }).firstSync()
    };

    if (iobj.data === null)
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);

    if (act) {
        var acl = checkout_obj_acl(session, act, iobj.data);
        if (!acl)
            return err_info(4030001, {}, cls.cid);
        iobj.acl = acl;
    }

    return iobj;
};

export const _eget = function (cls: FxOrmNS.Model, id: FibApp.IdPayloadVar, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): FibApp.FibAppInternalCommExtendObj {
    var rel_model = cls.extends[extend];
    if (rel_model === undefined)
        return err_info(4040001, {
            classname: extend
        }, cls.cid);

    var iobj;

    if (util.isObject(id)) {
        iobj = {
            data: id
        };
        id = (id as any).id;
    } else {
        iobj = {
            data: (cls as any).find().where({
                id: id
            }).firstSync()
        };

        if (iobj.data === null)
            return err_info(4040002, {
                id: id,
                classname: cls.model_name
            }, cls.cid);
    }

    var __opt;

    if (rel_model.type === 'hasOne') {
        if (rel_model.reversed)
            __opt = iobj.data[iobj.data.__opts.one_associations.find(a => a.name === extend).getAccessor].call(iobj.data);
        else {
            var rid1 = iobj.data[Object.keys(iobj.data.__opts.one_associations.find(a => a.name === extend).field)[0]];
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
        __opt = iobj.data[iobj.data.__opts.many_associations.find(a => a.name === extend).getAccessor].call(iobj.data);

    var riobj: FibApp.FibAppInternalCommExtendObj = {
        base: iobj.data,
        data: __opt.where({
            id: rid
        }).firstSync()
    };

    if (riobj.data === null)
        return err_info(4040002, {
            id: rid,
            classname: `${cls.model_name}.${extend}`
        }, rel_model.model.cid);

    if (act) {
        var acl = checkout_robj_acl(session, act, iobj.data, riobj.data, extend);
        if (!acl)
            return err_info(4030001, {}, rel_model.model.cid);
        riobj.acl = acl;
    }

    return riobj;
};
