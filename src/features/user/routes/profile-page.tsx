import React from 'react';

import { getCurrenUser } from "../../../services/auth-service";

const ProfilePage = () => {
    const currentUser = getCurrenUser();

    return (
        <div className="container">

        </div>
    );
}

export default ProfilePage;