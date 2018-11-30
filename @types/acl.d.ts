/// <reference types="fibjs" />
/// <reference path="common.d.ts" />

declare namespace FibAppACL {
    type ACLAct = 'create' | 'read' | 'write' | 'delete' | 'find' | string
    type ACLAllAct = '*'

    type ACLActString = ACLAct | ACLAllAct

    type AclPermisionAllowedFieldListType = ACLActString[]
    type AclPermisionBooleanType = boolean
    type AclPermissionType = boolean | AclPermisionAllowedFieldListType
    type Undefinable<T> = T | undefined

    type AclPermissionType__Create = Undefinable<AclPermissionType>;
    type AclPermissionType__Read = Undefinable<AclPermissionType>;
    type AclPermissionType__Write = Undefinable<AclPermissionType>;
    type AclPermissionType__Delete = Undefinable<AclPermisionBooleanType>;
    type AclPermissionType__Find = Undefinable<AclPermisionBooleanType>;

    type AclPermissionDescriptorKey = keyof RoleActDescriptorStruct
    interface AssociationModelACLDefinitionHash {
        [extendModelName: string]: RoleActDescriptor
    }
    interface RoleActDescriptorStruct {
        '*'?: Undefinable<AclPermisionBooleanType>;
        create?: AclPermissionType__Create;
        read?: AclPermissionType__Read;
        write?: AclPermissionType__Write;
        delete?: AclPermissionType__Delete;
        find?: AclPermissionType__Find;

        extends?: AssociationModelACLDefinitionHash
    }
    interface OACLDescriptorStruct extends RoleActDescriptorStruct {}

    type RoleActDescriptor = RoleActDescriptorStruct | boolean | undefined | AclPermisionAllowedFieldListType
    type OACLDescriptor = OACLDescriptorStruct | boolean

    type ACLGeneratorFn = (sess: FibApp.FibAppSession) => ACLDefinition
    type OACLGeneratorFn = (sess: FibApp.FibAppSession) => OACLDefinition

    type FibACLDef = ACLGeneratorFn | ACLDefinition
    type FibOACLDef = OACLGeneratorFn | OACLDefinition
    
    type AclDefinitionKeyname = keyof ACLDefinition
    interface ACLDefinition {
        // judge guest(all) visitor
        '*'?: RoleActDescriptor
        // judge visitor with role in Object.keys(roles)
        roles?: RoleActDescriptorHash
        // judge visitor with id = uid 
        [uid: string]: RoleActDescriptor
    }
    interface RoleActDescriptorHash {
        [roleName: string]: RoleActDescriptor
    }

    interface OACLDefinition extends ACLDefinition {}

    type ACLExtendModelNameType = string;

    type IsCheckoutValue = boolean;
    type ActCheckoutStatusType = Undefinable<IsCheckoutValue | AclPermisionAllowedFieldListType>
}
