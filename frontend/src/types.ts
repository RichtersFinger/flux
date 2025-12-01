export interface APIResponseMD {
    ok: boolean;
    error?: {
        code: number;
        short: string;
        long: string;
    }
}

export interface APIResponse<ContentType = any> {
    meta: APIResponseMD;
    content?: ContentType;
}
