import React from 'react';

import { logout } from "../../../services/auth-service";

const LogoutView = () => {
    logout();
    return (
        <>
        </>
    );
}

export default LogoutView;
