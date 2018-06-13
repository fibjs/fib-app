/// <reference path="./common.d.ts" />
/// <reference path="./acl.d.ts" />
/// <reference path="./req.d.ts" />
/// <reference path="./orm-patch.d.ts" />

/// <reference path="./app.d.ts" />

import App from '../src/app';

declare module "fib-app" {
    // export = FibAppClass;
    export = App
}
