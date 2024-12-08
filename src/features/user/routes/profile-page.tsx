import React, { useMemo, useState } from 'react';

import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';
import { useParams } from 'react-router-dom';
import { selectId } from '@utils/select-id';
import { Button } from 'primereact/button';
import { UserStats } from '../components/user-stats';

interface UserPageProps {
    id: string | null;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const params = useParams();
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    const [currentContent, setCurrentContent] = useState<number>(0);
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
                <h1>{currentUser?.name} </h1>
            </div>
            <div className="mb-5">
                <Button type="button" outlined label="Omistetut" className="p-button-primary mr-2"
                    onClick={() => setCurrentContent(0)} icon="pi pi-star-fill" />
                <Button type="button" outlined label="Muistilista" className="p-button-primary mr-2"
                    icon="pi pi-bookmark-fill"
                    onClick={() => setCurrentContent(1)} />
                <Button type="button" outlined label="Tilastoja" className="p-button-primary" icon="fa-solid fa-chart-line"
                    onClick={() => setCurrentContent(2)} />
            </div>
            {currentContent === 0 ? <OwnedBooks userId={profileId} listType="owned" /> : null}
            {currentContent === 1 ? <OwnedBooks userId={profileId} listType="wishlist" /> : null}
            {currentContent === 2 ? <UserStats userId={profileId} /> : null}
        </main >
    );
}

export default ProfilePage;