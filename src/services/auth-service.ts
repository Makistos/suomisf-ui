import axios from "axios";
//import { API_URL } from "../systemProps";
import { User } from "../features/user/types";

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
            if (response.data.accessToken) {
                console.log("accessToken");
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

export const logout = () => {
    localStorage.removeItem("user");
    window.location.reload();
    // const navigate = useNavigate();
    // navigate('/');
    console.log("logged out user");
}

export const getCurrenUser = (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
}