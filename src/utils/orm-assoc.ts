import { FxOrmInstance, FxOrmModel, FxOrmNS, FxOrmAssociation } from '@fxjs/orm';

import util = require('util')
import { FibApp } from '../Typo/app';
import { addHiddenProperty } from './obj';

export function check_hasmanyassoc_with_extraprops (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany | false {
    var has_many_association = instance.__instRtd.many_associations.find(a => a.name === extend_name);
    var has_extra_fields = has_many_association && has_many_association.props && util.isObject(has_many_association.props) && Object.keys(has_many_association.props).length

    return has_extra_fields ? has_many_association : false
}

export function extra_save (instance: FxOrmNS.Instance, rinstance: FxOrmNS.Instance, _many_assoc: FxOrmNS.InstanceAssociationItem_HasMany, extra: any, just_set: boolean = false): void {
    if (Array.isArray(extra))
        return extra.forEach(item => extra_save(instance, rinstance, _many_assoc, item))

    var hasCheck = instance[_many_assoc.hasAccessor + 'Sync'](rinstance)
    if (just_set && hasCheck) {
        /**
         * it has the same purpose of `instance[_many_assoc.setAccessor + 'Sync']`,
         * but there's one bug in patched instance's [_many_assoc.setAccessor]
         **/ 
        instance[_many_assoc.delAccessor + 'Sync'](rinstance, extra)
        instance[_many_assoc.addAccessor + 'Sync'](rinstance, extra)
    }
    else
        instance[_many_assoc.addAccessor + 'Sync'](rinstance, extra)
}

export function getAccessorForPost (
    assoc_info: FxOrmModel.Model['associations'][any],
    assoc_host_instance: FxOrmInstance.Instance,
    opts: {
        has_associated_instance_in_many?: boolean
    }
) {
    const assoc = assoc_info.association;
    let setterName: string;

    switch (assoc_info.type) {
        case 'hasOne':
            setterName = assoc.setAccessor
            break
        case 'hasMany':
            const { has_associated_instance_in_many = false } = opts || {};
            setterName = has_associated_instance_in_many ? assoc.setAccessor : assoc.addAccessor
            break
        case 'extendsTo':
            setterName = assoc.setAccessor
            break
    }

    // when pass assoc_host_instance, check if setterName in it
    if (assoc_host_instance && typeof assoc_host_instance[setterName] === 'function')
        return setterName;

    return setterName;
}

export function isSingleLink (type: string, association: FxOrmAssociation.InstanceAssociationItem) {
    return (type === 'hasOne'/*  && !association.reversed */) || type === 'extendsTo'
}

export function shouldSetSingle (
    assoc_info: FxOrmModel.Model['associations'][any]
) {
    return assoc_info.type === 'hasOne' && !assoc_info.association.reversed
}

export function getOneMergeIdFromAssocHasOne (
    association: FxOrmAssociation.InstanceAssociationItem
) {
    return Object.keys(association.field)[0]
}

export function getOneMergeIdFromAssocExtendsTo (
    association: FxOrmAssociation.InstanceAssociationItem
) {
    return Object.keys(association.field)[0]
}

export function addHiddenLazyLinker__AfterSave (instance: FxOrmInstance.Instance, linkers: Function[] = []) {
    linkers = (instance.$webx_lazy_linkers_after_save || []).concat(linkers)
    
    addHiddenProperty<Function[]>(instance, '$webx_lazy_linkers_after_save', linkers)
}

export function addHiddenLazyLinker__BeforeSave (instance: FxOrmInstance.Instance, linkers: Function[] = []) {
    linkers = (instance.$webx_lazy_linkers_before_save || []).concat(linkers)
    
    addHiddenProperty<Function[]>(instance, '$webx_lazy_linkers_before_save', linkers)
}

export function execLinkers (linkers: Function[], ...args: any[]) {
    ;(linkers || []).forEach(linker => linker.apply(null, args));
}

export function buildCleanInstance (
    model: FxOrmModel.Model,
    data: FxOrmInstance.InstanceDataPayload,
    opts: {
        keys_to_left?: string[]
    }
) {
    let { keys_to_left = null } = opts || {}

    if (!Array.isArray(keys_to_left))
        keys_to_left = getValidDataFieldsFromModel(model);

    data = util.pick(data, keys_to_left);
    
    const is_no_keys = model.id.some(iditem => !data.hasOwnProperty(iditem) || !data[iditem])
    // if no key, use pure Shell mode, or use new Mode
    const picked = is_no_keys ? undefined : model.id.map(iditem => data[iditem])

    const inst = new model(picked);

    keys_to_left.forEach(key => {
        if (data.hasOwnProperty(key))
            inst.set(key, data[key]);
    })

    return inst;
}

export function buildShellInstance (
    model: FxOrmModel.Model,
    id: FibApp.AppIdType,
    extra_data?: FxOrmInstance.InstanceDataPayload
): FxOrmInstance.Instance {
    const inst = new model(id || undefined)
    if (extra_data)
        inst.extra = extra_data

    return inst
}

export function getValidDataFieldsFromModel (model: FxOrmModel.Model, keep_associations: boolean = true) {
    return []
        .concat(
            Object.keys(model.allProperties)
        )
        .concat(
            keep_associations
            ? Object.keys(model.associations).filter(k => model.associations[k].type !== 'extendsTo')
            : []
        )
        .concat(
            keep_associations
            ? 'extra'
            : []
        )
}

export function safeUpdateHasManyAssociatedInstanceWithExtra (
    assoc: FxOrmAssociation.InstanceAssociationItem_HasMany,
    host_instance: FxOrmInstance.Instance,
    associated_instance: FxOrmInstance.Instance,
    has_associated_instance_in_many: boolean
) {
    let extra = associated_instance.$extra || {}
    delete associated_instance.$extra

    if (has_associated_instance_in_many) {
        host_instance[assoc.delAccessor + 'Sync'](associated_instance)
    }
    
    host_instance[assoc.addAccessor + 'Sync'](associated_instance, extra)
}