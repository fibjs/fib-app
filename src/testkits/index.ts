import getRestClient from './http-client'
import assert = require('assert')
import { mountAppToSessionServer } from "./http-server";

import { FibApp } from '../Typo/app';

export function bind (app: FibApp.FibAppClass) {
    app.test = {
        mountAppToSessionServer: mountAppToSessionServer,

        getRestClient: getRestClient,
        internalApiResultAssert: {
            ok: checkInternalApiResult_OK,
            fail: checkInternalApiResult_Fail,
        },
    }
}

function checkInternalApiResult_OK (result: FibApp.FibAppApiFunctionResponse) {
    // assert.property(result, 'status')
    assert.property(result, 'success')
}

function checkInternalApiResult_Fail (result: FibApp.FibAppApiFunctionResponse) {
    // assert.property(result, 'status')
    assert.property(result, 'error')
}
