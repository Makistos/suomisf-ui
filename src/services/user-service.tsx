import React, { useRef } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import { User } from "../features/user/types";
import authHeader, { refreshHeader } from "./auth-header";

const baseURL = process.env.REACT_APP_API_URL;

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

const postPublicContent = async (url: string, dataOut: any, callback: cbType | null, user: User | null): Promise<HttpStatusResponse> => {
    const addr = process.env.REACT_APP_API_URL + url;
    let error_msg = "";
    let status = 0;
    //let retval: HttpStatusResponse = { response: '', status: 0 };
    try {
        const { data } = await axios.post<HttpStatusResponse>(addr, dataOut, { headers: authHeader() })
        //console.log(data)
        return data
        // .then((response) => {
        //     if (callback) {
        //         callback(response.data);
        //     }
        //     console.log("Post response: " + response.data)
        //     return response.data;
        // })
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
        return { response: error_msg, status: 0 }
    }
}

export const putContent = async (url: string, data: any, user: User | null): Promise<HttpStatusResponse> => {
    const addr = process.env.REACT_APP_API_URL + url;
    let error_msg = "";
    let status = 0;
    await axios.put(addr, data, { headers: authHeader() })
        .then((response) => {
            return response.data;
        })
        .catch((err: AxiosError) => {
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
        })
    return { response: error_msg, status: 0 };
}

export const deleteApiContent = async (url: string): Promise<HttpStatusResponse> => {
    const addr = process.env.REACT_APP_API_URL + url;
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

export const postApiContent = (url: string, data: any, user: User | null) => {
    return postPublicContent(url, data, null, user)
}

export const putApiContent = (url: string, data: any, user: User | null) => {
    return putContent(url, data, user);
}