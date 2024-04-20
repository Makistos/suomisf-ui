import axios from "axios";

import { User } from "../features/user/types";
import authHeader, { refreshHeader } from "./auth-header";

const baseURL = import.meta.env.VITE_API_URL;

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

export const getPublicContent = (url: string) => {
    console.log(baseURL + url);
    return axios.get(baseURL + url);
};

export const getUserContent = (url: string) => {
    return axios.get(baseURL + url, { headers: authHeader() });
}

export const getApiContent = (url: string, user: User | null) => {
    if (user === undefined || user === null) {
        return getPublicContent(url);
    } else {
        return getUserContent(url);
    }
}

const postContent = async (url: string, dataOut: any, callback: cbType | null, user: User | null): Promise<HttpStatusResponse> => {
    const addr = import.meta.env.VITE_API_URL + url;
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

export const putContent = async (url: string, data: any, user: User | null): Promise<HttpStatusResponse> => {
    const addr = import.meta.env.VITE_API_URL + url;
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

export const deleteApiContent = async (url: string): Promise<HttpStatusResponse> => {
    const addr = import.meta.env.VITE_API_URL + url;
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

export const postApiContent = (url: string, data: any, user: User | null) => {
    return postContent(url, data, null, user)
}

export const putApiContent = (url: string, data: any, user: User | null) => {
    return putContent(url, data, user);
}