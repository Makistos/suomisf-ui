import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
//import { API_URL } from "../systemProps";
import { User } from "../features/user/types";
import authHeader, { refreshHeader } from "./auth-header";


const baseURL = process.env.REACT_APP_API_URL;

export const register = (username: string, email: string, password: string) => {

    return axios.post(baseURL + "register", {
        username,
        email,
        password,
    });
};

export async function login(username: string, password: string) {
    return await axios.post(baseURL + "login",
        {
            'username': username,
            'password': password
        })
        .then((response) => {
            console.log("Login response: " + JSON.stringify(response, null, 2));
            if (response.data.access_token) {
                //console.log("access_token");
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

export const logout = () => {
    localStorage.removeItem("user");
    window.location.reload();
    console.log("logged out user");
}

export const getCurrenUser = (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
}

export const refreshAccessTokenFn = async () => {
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
        user = JSON.parse(userStr);
    }
    if (!user) return Promise.reject("No user found");
    const header = refreshHeader();
    const data = { 'username': user.user };
    try {
        const response = await axios.post(baseURL + "refresh", data, { headers: header });
        localStorage.setItem("user", JSON.stringify(response.data));
        console.log("token refreshed");
        return response;
    } catch (error) {
        console.log("error refreshing token: " + JSON.stringify(error, null, 2));
    }
    return null;
}

const axiosApiInstance = axios.create();

axios.interceptors.response.use(
    (response: AxiosResponse<any>) => {
        return response;
    },
    async (error: AxiosError<any>) => {
        const originalConfig = error?.config;
        if (!originalConfig) return Promise.reject(error);
        if (error?.response?.status === 401 && error?.response?.data['msg'].includes("Token has expired")) {
            console.log("token expired");
            const res = await refreshAccessTokenFn()
                .then((response) => {
                    //localStorage.setItem("user", JSON.stringify(response.data));
                    console.log("token refreshed");
                    //delete originalConfig.headers.Authorization;
                    //originalConfig.headers.Authorization = "Bearer " + authHeader();
                    const auth = authHeader();
                    if (auth !== undefined) {
                        originalConfig.headers['Authorization'] = auth.Authorization;
                        axios.defaults.headers.common['Authorization'] = auth.Authorization;
                        return axiosApiInstance(originalConfig);
                    } else {
                        return Promise.reject("No auth header");
                    }
                })
                .catch((error) => {
                    localStorage.removeItem("user");
                    if (error.response) {
                        console.log(error.response.data);
                    } else if (error.request) {
                        console.log(error.request);
                    } else {
                        console.log('Error', error.message);
                    }
                });
            return Promise.resolve(res);
        } else {
            return Promise.reject(error);
        }
    }
);