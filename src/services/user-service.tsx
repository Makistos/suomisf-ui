import React, { useRef } from "react";
import axios from "axios";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import { User } from "../features/user/types";
import authHeader from "./auth-header";

const baseURL = process.env.REACT_APP_API_URL;

const ConfirmAccessDenied = () => {
    // const toast = useRef<Toast>(null);
    // const accept = () => {
    //     toast.current?.show({ severity: 'error', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
    // }
    // const reject = () => {
    //     toast.current?.show({ severity: 'warn', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
    // }
    // const confirm1 = () => {
    //     confirmDialog
    //         ({
    //             message: "Ole hyvä ja kirjaudu uudestaan",
    //             header: "Istunto vanhentunut",
    //             icon: "pi pi-exclamation-triangle",
    //             accept,
    //             reject
    //         });
    // };

    return (
        <ConfirmDialog
            visible={true}
            message="Ole hyvä ja kirjaudu uudestaan"
            header="Istunto vanhentunut"
            icon="pi pi-exclamation-triangle"
        />
    )
}

const handleError = (error: any) => {
    let message = "";
    if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        message = error.response.status + ": " + error.response.data;
    } else if (error.request) {
        console.log(error.request);
        message = error.request;
    } else {
        console.log('Error', error.message);
        message = error.message;
    }
    console.log(error.config);
    //<ConfirmAccessDenied />

}

interface cbType {
    (data: any): any;
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

const postPublicContent = (url: string, data: any, callback: cbType | null, user: User | null): any => {
    const addr = process.env.REACT_APP_API_URL + url;
    console.log('Posting to address ' + addr);
    axios.post(addr, data, { headers: authHeader() })
        .then((response) => {
            if (callback) {
                callback(response.data);
            }
            return response.data;
            //console.log("Post response: " + retval)
        })
        .catch((response) => {
            console.log(response);
        })
    //return retval;
}

export const putContent = (url: string, data: any, user: User | null): any => {
    const addr = process.env.REACT_APP_API_URL + url;
    axios.put(addr, data, { headers: authHeader() })
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            handleError(error);
        })
}

export const deleteApiContent = (url: string): any => {
    const addr = process.env.REACT_APP_API_URL + url;
    axios.delete(addr, { headers: authHeader() })
        .then((response) => {
            return response.data;
        })
        .catch((err) => {
            if (err.response) {
                console.log("server error: " + JSON.stringify(err.response, null, 2));
            } else if (err.request) {
                console.log("no response: " + JSON.stringify(err.request, null, 2));
            } else {
                console.log("other error: " + JSON.stringify(err.tostring, null, 2));
            }
        })
}

export const postApiContent = (url: string, data: any, user: User | null) => {
    return postPublicContent(url, data, null, user);
}

export const putApiContent = (url: string, data: any, user: User | null) => {
    return putContent(url, data, user);
}