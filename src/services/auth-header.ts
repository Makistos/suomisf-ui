export default function authHeader() {
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
        user = JSON.parse(userStr);
    }

    if (user && user.access_token) {
        const retval = {
            "Authorization": "Bearer " + user.access_token,
            //"X-CSRF-TOKEN": user.access_token
        };
        //console.log("authHeader: " + JSON.stringify(retval, null, 2));
        return retval;
    } else {
        console.log("authHeader: undefined");
        return undefined;
    }
}

export function refreshHeader() {
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
        user = JSON.parse(userStr);
    }

    if (user && user.refresh_token) {
        const retval = {
            "Authorization": "Bearer " + user.refresh_token,
            "X-CSRF-TOKEN": user.refresh_token
        };
        //console.log("refreshHeader: " + JSON.stringify(retval, null, 2));
        return retval;
    } else {
        return undefined;
    }
}