/// <reference path="../../@types/index.d.ts" />

import util = require('util');
import { err_info } from '../utils/err_info';
import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';
import { get_one_association_item, get_many_association_item } from './orm-assoc';

export const _get = function (cls: FxOrmNS.Model, id: FibApp.AppIdType, session: FibApp.FibAppSession, act?: FibAppACL.ACLActString): FibApp.FibAppInternalCommObj {
    var iobj: FibApp.FibAppInternalCommObj = {
        inst: (cls as any).find().where({
            id: id
        }).firstSync()
    };

    if (iobj.inst === null)
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);

    if (act) {
        var acl = checkout_obj_acl(session, act, iobj.inst);
        if (!acl)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);
        iobj.acl = acl;
    }

    return iobj;
};

export const _eget = function (cls: FxOrmNS.Model, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): FibApp.FibAppInternalCommExtendObj {
    return _egetx(cls, id, extend, rid, session, act).riobj
}

function wrap_error (err: FibApp.FibAppResponse) {
    return {
        riobj: err,
        iobj: err
    }
}

export const _egetx = function (cls: FxOrmNS.Model, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): {
    riobj: FibApp.FibAppInternalCommExtendObj,
    iobj: FibApp.FibAppInternalCommExtendObj
} {
    var rel_model = cls.extends[extend];
    if (rel_model === undefined)
        return wrap_error(
            err_info(4040001, {
                classname: extend
            }, cls.cid)
        )

    var iobj;

    if (util.isObject(id)) {
        iobj = {
            inst: id as FxOrmNS.Instance
        };
        id = (id as any).id;
    } else {
        iobj = {
            inst: (cls as any).find().where({
                id: id
            }).firstSync()
        };

        if (iobj.inst === null)
            return wrap_error(
                err_info(4040002, {
                    id: id,
                    classname: cls.model_name
                }, cls.cid)
            );
    }

    var __opt;

    if (rel_model.type === 'hasOne') {
        if (rel_model.reversed)
            __opt = iobj.inst[get_one_association_item(iobj.inst, extend).getAccessor].call(iobj.inst);
        else {
            var rid1 = iobj.inst[Object.keys(get_one_association_item(iobj.inst, extend).field)[0]];
            if (rid === undefined)
                rid = rid1;
            else if (rid != rid1)
                return wrap_error(
                    err_info(4040002, {
                        id: rid,
                        classname: `${cls.model_name}.${extend}`
                    }, rel_model.model.cid)
                );
            __opt = rel_model.model.find();
        }
    } else
        __opt = iobj.inst[get_many_association_item(iobj.inst, extend).getAccessor].call(iobj.inst);

    var riobj: FibApp.FibAppInternalCommExtendObj = {
        base: iobj.inst,
        inst: __opt.where({
            id: rid
        }).firstSync()
    };

    if (riobj.inst === null)
        return wrap_error(
            err_info(4040002, {
                id: rid,
                classname: `${cls.model_name}.${extend}`
            }, rel_model.model.cid)
        );

    if (act) {
        var acl = checkout_robj_acl(session, act, iobj.inst, riobj.inst, extend);
        if (!acl)
            return wrap_error(
                err_info(4030001, {classname: cls.model_name}, rel_model.model.cid)
            );
        riobj.acl = acl;
    }

    return {
        riobj,
        iobj
    };
};