import React, { useMemo, useState } from 'react';

import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';

interface UserPageProps {
    id?: string | null;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    //const [profileId, setProfileId] = useState<string | null>(null);
    let profileId = id ? id : (currentUser ? currentUser.id.toString() : null);


    // If id is not provided, use the current user. So opening this page
    // without id will show the profile of the current user.
    // if (!id) {
    //     setProfileId(currentUser ? currentUser.id.toString() : null);
    // } else {
    //     setProfileId(id);
    // }

    if (!profileId) {
        return null;
    }

    return (
        <main className="all-content">
            <div className="grid col-12 justify-content-center mb-5">
                <h1>Omistetut kirjat</h1>
            </div>
            <OwnedBooks userId={profileId} />

        </main >
    );
}

export default ProfilePage;