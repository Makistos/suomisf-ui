import axios from "axios";

import { User } from "../features/user/types";
import authHeader, { refreshHeader } from "./auth-header";
import { shouldUseNewApi, HttpMethod } from "../config/api-routing";

const baseURL = import.meta.env.VITE_API_URL;
const newBaseURL = import.meta.env.VITE_NEW_API_URL;

// Re-export for convenience
export { shouldUseNewApi };

const handleError = (error: any): string => {
    let message = "";
    if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        message = error.response.data['msg']
    } else if (error.request) {
        console.log(error.request);
        message = error.request;
    } else {
        console.log('Error', error.message);
        message = error.message;
    }
    //console.log(error.config);
    //<ConfirmAccessDenied />
    return message;
}

interface cbType {
    (data: any): any;
}

export interface HttpStatusResponse {
    response: string,
    status: number
}

export const getPublicContent = (url: string, newApi = false) => {
    const base = newApi ? newBaseURL : baseURL;
    return axios.get(base + url);
};

export const getUserContent = (url: string, newApi = false) => {
    const base = newApi ? newBaseURL : baseURL;
    return axios.get(base + url, { headers: authHeader() });
}

export const getApiContent = (url: string, user: User | null, newApi?: boolean) => {
    // If newApi is not explicitly specified, use the automatic routing logic
    const useNewApi = newApi !== undefined ? newApi : shouldUseNewApi(url, 'GET');

    if (user === undefined || user === null) {
        return getPublicContent(url, useNewApi);
    } else {
        return getUserContent(url, useNewApi);
    }
}

const postContent = async (url: string, dataOut: any, callback: cbType | null, user: User | null, newApi?: boolean): Promise<HttpStatusResponse> => {
    // If newApi is not explicitly specified, use the automatic routing logic
    const useNewApi = newApi !== undefined ? newApi : shouldUseNewApi(url, 'POST');
    const addr = (useNewApi ? newBaseURL : baseURL) + url;
    let error_msg = "";
    let status = 0;
    try {
        const response = await axios.post(addr, dataOut, { headers: authHeader() });
        const retval: HttpStatusResponse = {
            response: response.data,
            status: response.status
        }
        if (response.status === 201 || response.status === 200) {
            return retval;
        } else {
            throw new Error(response.data);
        }
    } catch (err: any) {
        if (err.response) {
            error_msg = JSON.stringify(err.response, null, 2);
            status = err.response.status;
            console.log("server error: " + error_msg);
        } else if (err.request) {
            error_msg = JSON.stringify(err.request, null, 2);
            status = err.request.status;
            console.log("no response: " + error_msg);
        } else {
            error_msg = JSON.stringify(err, null, 2);
            console.log("other error: " + error_msg);
        }
    }
    return new Promise<HttpStatusResponse>((resolve, reject) => {
        const retval: HttpStatusResponse = {
            response: error_msg,
            status: status
        }
        reject(retval);
    })
}

export const putContent = async (url: string, data: any, user: User | null, newApi?: boolean): Promise<HttpStatusResponse> => {
    // If newApi is not explicitly specified, use the automatic routing logic
    const useNewApi = newApi !== undefined ? newApi : shouldUseNewApi(url, 'PUT');
    const addr = (useNewApi ? newBaseURL : baseURL) + url;
    let error_msg = "";
    let status = 0;
    try {
        const response = await axios.put(addr, data, { headers: authHeader() });
        const retval: HttpStatusResponse = {
            response: response.data,
            status: response.status
        }
        if (response.status === 200 || response.status === 201) {
            return retval;
        } else {
            throw new Error(response.data);
        }
    } catch (err: any) {
        if (err.response) {
            error_msg = JSON.stringify(err.response, null, 2);
            status = err.response.status;
            console.log("server error: " + error_msg);
        } else if (err.request) {
            error_msg = JSON.stringify(err.request, null, 2);
            status = err.request.status;
            console.log("no response: " + error_msg);
        } else {
            error_msg = JSON.stringify(err, null, 2);
            console.log("other error: " + error_msg);
        }
    }
    return new Promise<HttpStatusResponse>((resolve, reject) => {
        const retval: HttpStatusResponse = {
            response: error_msg,
            status: status
        }
        reject(retval);
    })
}

export const deleteApiContent = async (url: string, newApi?: boolean): Promise<HttpStatusResponse> => {
    // If newApi is not explicitly specified, use the automatic routing logic
    const useNewApi = newApi !== undefined ? newApi : shouldUseNewApi(url, 'DELETE');
    const addr = (useNewApi ? newBaseURL : baseURL) + url;
    let error_msg = "";
    let status = 0;
    try {
        const response = await axios.delete(addr, { headers: authHeader() });
        const retval: HttpStatusResponse = {
            response: response.data,
            status: response.status
        }
        if (response.status === 200) {
            return retval;
        } else {
            throw new Error(response.data);
        }
    } catch (err: any) {
        if (err.response) {
            error_msg = err.response["data"]["msg"];
            status = err.response.status;
            console.log("server error: " + error_msg);
        } else if (err.request) {
            error_msg = JSON.stringify(err.request, null, 2);
            status = err.request.status;
            console.log("no response: " + error_msg);
        } else {
            error_msg = JSON.stringify(err, null, 2);
            console.log("other error: " + error_msg);
        }
    }
    return new Promise<HttpStatusResponse>((resolve, reject) => {
        resolve({
            response: error_msg,
            status: status
        })
    })
}

export const postApiContent = (url: string, data: any, user: User | null, newApi?: boolean) => {
    return postContent(url, data, null, user, newApi)
}

export const putApiContent = (url: string, data: any, user: User | null, newApi?: boolean) => {
    return putContent(url, data, user, newApi);
}