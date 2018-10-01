/// <reference path="./common.d.ts" />
/// <reference path="./acl.d.ts" />
/// <reference path="./req.d.ts" />
/// <reference path="./orm-patch.d.ts" />

/// <reference path="./app.d.ts" />

import { FibAppClass } from "./app";

declare module "fib-app" {
    export = FibAppClass;
}
