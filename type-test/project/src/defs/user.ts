import { defineAppModel } from '@src';

const UserDef = defineAppModel((orm) => {
    const User = orm.define('users', {
        name: String,
        age: Number,
    }, {
        methods: {
            getAge() {
                return this.age;
            },
            getName() {
                return this.name;
            }
        }
    });
    
    const Role = orm.define('role', {
        name: String,
        permissions: [
            'admin' as const,
            'visitor' as const
        ],
    }, {
        methods: {
            getPermission() {
                return this.permissions;
            }
        }
    });

    return { User, Role };
});

export default UserDef;

type Defs = ReturnType<typeof UserDef>;

declare module 'fib-app' {
    export namespace FibApp {
        export interface GlobalAppModels {
            users: Defs['User'];
            role: Defs['Role'];
        }
    }
}