import axios from "axios";
import { IUser } from "../user";
import authHeader from "./auth-header";
import { API_URL } from "../systemProps";

const baseURL = API_URL;
export const getPublicContent = (url: string) => {
    return axios.get(baseURL + url);
};

export const getUserContent = (url: string) => {
    return axios.get(baseURL + url, { headers: authHeader() });
}

export const getApiContent = (url: string, user: IUser | null) => {
    if (user === undefined || user === null) {
        return getPublicContent(url);
    } else {
        return getUserContent(url);
    }
}