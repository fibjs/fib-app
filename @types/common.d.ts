type AppIdType = number | string

type UidType = AppIdType
type UserRoleName = string

interface FibAppSession {
    id?: AppIdType;
    roles?: UserRoleName[];
}

interface FibAppSuccessResponse {
    status?: number;
    success: any;
}

interface FibAppErrorResponse {
    status?: number;
    error: any;
}

interface FibAppResponse<SDT = any> {
    status?: number;
    success?: SDT;
    error?: FibAppFinalError;
}

type FibAppApiFunctionResponse<DT = any> = FibAppResponse<DT>
type FibAppModelFunctionResponse<DT = any> = FibAppResponse<{data: DT, message: string}>

interface FibAppFinalError {
    code: number;
    name: string;
    message: string;
}

interface ObjectWithIdField {
    id: AppIdType
    [extraProp: string]: any
}

type IdPayloadVar = ObjectWithIdField | AppIdType

// type FibAppResponse = FibAppSuccessResponse | FibAppErrorResponse
