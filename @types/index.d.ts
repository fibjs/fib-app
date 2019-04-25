/// <reference types="@fibjs/types" />
/// <reference types="@fxjs/orm" />
/// <reference types="fib-session" />

/// <reference path="./common.d.ts" />
/// <reference path="./acl.d.ts" />
/// <reference path="./req.d.ts" />
/// <reference path="./orm-patch.d.ts" />

/// <reference path="./app.d.ts" />

/// <reference path="./test.d.ts" />

declare module "fib-app" {
    export = FibApp.FibAppClass;
}
