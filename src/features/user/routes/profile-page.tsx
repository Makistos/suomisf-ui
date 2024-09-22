import React, { useMemo, useState } from 'react';

import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';
import { useParams } from 'react-router-dom';
import { selectId } from '@utils/select-id';

interface UserPageProps {
    id: string | null;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const params = useParams();
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    let profileId = "";
    try {
        profileId = selectId(params, id);
    } catch (e) {
        console.log(`${e} profile`);
    }

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