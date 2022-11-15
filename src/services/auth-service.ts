import axios from "axios";
import { API_URL } from "../systemProps";
import { IUser } from "../feature/User/User";

const baseURL = API_URL;

export const register = (username: string, email: string, password: string) => {

    return axios.post(baseURL + "register", {
        username,
        email,
        password,
    });
};

export async function login(username: string, password: string) {
    return await axios.post(API_URL + "login",
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
    // const navigate = useNavigate();
    // navigate('/');
    console.log("logged out user");
}

export const getCurrenUser = (): IUser | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
}