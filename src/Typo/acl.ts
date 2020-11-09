/// <reference types="@fibjs/types" />

import { FibApp } from "./app"

export namespace FibAppACL {
    export type ACLAct = 'create' | 'read' | 'write' | 'delete' | 'find' | string
    export type ACLAllAct = '*'

    export type ACLActString = ACLAct | ACLAllAct

    export type AclPermisionAllowedFieldListType = ACLActString[]
    export type AclPermisionBooleanType = boolean
    export type AclPermissionType = boolean | AclPermisionAllowedFieldListType
    export type Undefinable<T> = T | undefined

    export type AclPermissionType__Create = Undefinable<AclPermissionType>;
    export type AclPermissionType__Read = Undefinable<AclPermissionType>;
    export type AclPermissionType__Write = Undefinable<AclPermissionType>;
    export type AclPermissionType__Delete = Undefinable<AclPermisionBooleanType>;
    export type AclPermissionType__Find = Undefinable<AclPermisionBooleanType>;

    export type AclPermissionDescriptorKey = keyof RoleActDescriptorStruct
    export interface AssociationModelACLDefinitionHash {
        [extendModelName: string]: RoleActDescriptor
    }
    export interface RoleActDescriptorStruct {
        '*'?: Undefinable<AclPermisionBooleanType>;
        create?: AclPermissionType__Create;
        read?: AclPermissionType__Read;
        write?: AclPermissionType__Write;
        delete?: AclPermissionType__Delete;
        find?: AclPermissionType__Find;

        extends?: AssociationModelACLDefinitionHash
    }
    export interface OACLDescriptorStruct extends RoleActDescriptorStruct {}

    export type RoleActDescriptor = RoleActDescriptorStruct | boolean | undefined | AclPermisionAllowedFieldListType
    export type OACLDescriptor = OACLDescriptorStruct | boolean

    export type ACLGeneratorFn = (sess: FibApp.FibAppSession) => ACLDefinition
    export type OACLGeneratorFn = (sess: FibApp.FibAppSession) => OACLDefinition

    export type FibACLDef = ACLGeneratorFn | ACLDefinition
    export type FibOACLDef = OACLGeneratorFn | OACLDefinition
    
    export type AclDefinitionKeyname = keyof ACLDefinition
    export interface ACLDefinition {
        // judge guest(all) visitor
        '*'?: RoleActDescriptor
        // judge visitor with role in Object.keys(roles)
        roles?: RoleActDescriptorHash
        // judge visitor with id = uid 
        [uid: string]: RoleActDescriptor
    }
    export interface RoleActDescriptorHash {
        [roleName: string]: RoleActDescriptor
    }

    export interface OACLDefinition extends ACLDefinition {}

    export type ACLExtendModelNameType = string;

    export type IsCheckoutValue = boolean;
    export type ActCheckoutStatusType = Undefinable<IsCheckoutValue | AclPermisionAllowedFieldListType>
}
