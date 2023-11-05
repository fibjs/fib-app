import { expectType } from 'ts-expect';

import App, { FibApp, makeCustomizeApiRoute } from '@src';

import { UserDef } from './defs';

declare function isNotAuthorized(req: FibApp.FibAppHttpRequest): boolean;
declare function isAuthorized(req: FibApp.FibAppHttpRequest): boolean;

const customizeApiRoute = makeCustomizeApiRoute(({ onApiRoute }) => {
    return (ctx) => {
        return [
            onApiRoute(ctx, 'http-rest-find', 'users', (req) => {
                expectType<FibApp.FibAppHttpRequest>(req);

                if (isNotAuthorized(req)) {
                    return req.end();
                }

                // deal with your request
                expectType<FibApp.FibAppClass>(ctx.app);

                // then ...
                req.end();
            }),
            // original fib-app handler, we must make sure it in the array,
            // by default, it should be at the last position, if you want to
            // put it in the middle, enable `allowCustomizePostApiRoute` option
            ctx.handler,
        ]
    }
}, {
    allowCustomizePostApiRoute: false,
})

const app = new App('sqlite://:memory:', {
    customizeApiRoute,
}, {});

app.db(orm => {
    UserDef(orm);

    expectType<ReturnType<typeof UserDef>['User']>(orm.models.users);
    expectType<ReturnType<typeof UserDef>['Role']>(orm.models.role);

    const user = new orm.models.users();

    expectType<string>(user.name);
    expectType<string>(user.getName());
    expectType<number>(user.age);
    expectType<number>(user.getAge());

    const role = new orm.models.role();
    expectType<'admin' | 'visitor'>(role.permissions);
    expectType<'admin' | 'visitor'>(role.getPermission());
});