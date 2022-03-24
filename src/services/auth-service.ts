import axios from "axios";

//const baseURL = "http://www.sf-bibliografia.fi/api/";
const baseURL = "http://localhost:5000/api/";

export const register = (username: string, email: string, password: string) => {

    return axios.post(baseURL + "register", {
        username,
        email,
        password,
    });
};

export const login = (username: string, password: string) => {
    return axios.post(baseURL + "login", {
        username,
        password,
    })
        .then((response) => {
            console.log(response);
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

export const getCurrenUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
}