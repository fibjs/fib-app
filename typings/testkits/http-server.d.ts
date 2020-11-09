/// <reference types="@fibjs/types" />
import { FibApp } from '../Typo/app';
export declare function getTestRouting(app: FibApp.FibAppClass, opts: FibApp.GetTestRoutingOptions): Class_Routing;
export declare function mountAppToSessionServer(app: FibApp.FibAppClass, options: FibApp.GetTestServerOptions): FibApp.SessionTestServerInfo;
