/// <reference types="@fibjs/types" />
import { FibApp } from "../Typo/app";
declare const infos: {
    "4000001": string;
    "4000002": string;
    "4000003": string;
    "4000004": string;
    "4000005": string;
    "4000006": string;
    "4000007": string;
    "4000008": string;
    "4000009": string;
    "4030001": string;
    "4030002": string;
    "4040001": string;
    "4040002": string;
    "4040003": string;
    "4040004": string;
    "4040005": string;
    "5000002": string;
    "5000003": string;
};
declare type TInfos = typeof infos;
export declare class APPError extends Error implements FibApp.FibAppFinalError {
    name: string;
    code: FibApp.FibAppFinalError['code'];
    message: string;
    cls?: FibApp.FibModelCountTypeMACRO;
    constructor(code: FibApp.FibAppFinalError['code'], message: string, cls?: FibApp.FibModelCountTypeMACRO);
    toString(): string;
}
export declare function err_info(code: keyof TInfos | number, data?: Fibjs.AnyObject, cls?: FibApp.FibModelCountTypeMACRO): FibApp.FibAppErrorResponse;
export declare function make_err_message(code: keyof TInfos, data: Record<string, any>): string;
export declare function err_info_msg(code: keyof TInfos | number, msg?: string, cls?: FibApp.FibModelCountTypeMACRO): FibApp.FibAppErrorResponse;
export declare function payload_code_to_status_code(code: number | string): number;
export declare function fill_error(req: FibApp.FibAppHttpRequest, e: FibApp.FibAppResponse): void;
export declare function render_error(req: FibApp.FibAppHttpRequest, e: FibApp.FibAppResponse, renderFunction?: any): void;
export {};
