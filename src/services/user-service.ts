import axios from "axios";
import { IUser } from "../user";
import authHeader from "./auth-header";

const API_URL = "http://localhost:5000/api/";

export const getPublicContent = (url: string) => {
    return axios.get(API_URL + url);
};

export const getUserContent = (url: string) => {
    return axios.get(API_URL + url, { headers: authHeader() });
}

export const getApiContent = (url: string, user: IUser) => {
    if (user === undefined) {
        return getPublicContent(url);
    } else {
        return getUserContent(url);
    }
}