/// <reference types="@fxjs/orm" />
import util = require('util')

export function getInstanceManyAssociations (instance: FxOrmNS.Instance): FxOrmNS.InstanceAssociationItem_HasMany[] {
    return instance.__opts.many_associations
}

export function getInstanceManyAssociation (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany {
    const many_assocs = getInstanceManyAssociations(instance)
    
    return many_assocs.find(a => a.name === extend_name)
}

export function getInstanceOneAssociations (instance: FxOrmNS.Instance): FxOrmNS.InstanceAssociationItem_HasOne[] {
    return instance.__opts.one_associations
}

export function getInstanceOneAssociation (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasOne {
    const one_assocs = getInstanceOneAssociations(instance)
    
    return one_assocs.find(a => a.name === extend_name)
}

export function check_hasmany_extend_extraprops (m: FxOrmNS.Model, extend_name: string) {
    const inst = new m()

    var has_many_association = inst.__opts.many_associations.find(a => a.name === extend_name);
    var has_extra_fields = has_many_association && has_many_association.props && util.isObject(has_many_association.props) && Object.keys(has_many_association.props).length

    return has_extra_fields ? has_many_association : false
}