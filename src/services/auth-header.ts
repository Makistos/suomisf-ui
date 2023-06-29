export default function authHeader() {
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
        user = JSON.parse(userStr);
    }

    if (user && user.accessToken) {
        const retval = { "Authorization": "Bearer " + user.accessToken };
        //console.log("authHeader: " + JSON.stringify(retval, null, 2));
        return retval;
    } else {
        return undefined;
    }
}