import axios from "axios";
import { IUser } from "../user";
import authHeader from "./auth-header";
import { SITE_URL } from "../systemProps";

export const getPublicContent = (url: string) => {
    return axios.get(SITE_URL + url);
};

export const getUserContent = (url: string) => {
    return axios.get(SITE_URL + url, { headers: authHeader() });
}

export const getApiContent = (url: string, user: IUser) => {
    if (user === undefined) {
        return getPublicContent(url);
    } else {
        return getUserContent(url);
    }
}