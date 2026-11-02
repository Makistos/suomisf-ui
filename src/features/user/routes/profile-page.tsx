import React, { useMemo, useState } from 'react';
import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';
import { ReadBooks } from '../components/read-books';
import { useParams, useSearchParams } from 'react-router-dom';
import { selectId } from '@utils/select-id';
import { Button } from 'primereact/button';
import { UserStats } from '../components/user-stats';
import { CollectionStatsDialog } from '../components/collection-stats-dialog';
import { getApiContent } from '@services/user-service';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';

interface UserPageProps {
    id: string | null;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const params = useParams();
    
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    // Persist the open view in the URL (?view=) so it is restored when the
    // user follows a link and navigates back, and so it survives a reload.
    const [searchParams, setSearchParams] = useSearchParams();
    const parsedView = Number(searchParams.get('view'));
    const currentContent = Number.isFinite(parsedView) ? parsedView : 0;
    const setCurrentContent = (view: number) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', String(view));
            return next;
        }, { replace: true });
    };
    const [collectionStatsVisible, setCollectionStatsVisible] = useState(false);
    let profileId = "";
    try {
        profileId = selectId(params, id);
    } catch (e) {
        console.log(`${e} profile`);
    }

    // Fetch profile user data
    const fetchProfileUser = async (userId: string): Promise<User> => {
        const response = await getApiContent(`users/${userId}`, currentUser);
        return response.data;
    };

    const { data: profileUser, isLoading: isLoadingProfileUser, isError } = useQuery({
        queryKey: ['user', profileId],
        queryFn: () => fetchProfileUser(profileId),
        enabled: !!profileId
    });

    if (!profileId) {
        return null;
    }

    // Show loading state while fetching profile user
    if (isLoadingProfileUser) {
        return (
            <main className="all-content">
                <div className="grid col-12 justify-content-center mb-5">
                    <h1>Loading...</h1>
                </div>
            </main>
        );
    }

    // Show error state if profile user fetch failed
    if (isError || !profileUser) {
        return (
            <main className="all-content">
                <div className="grid col-12 justify-content-center mb-5">
                    <h1>User not found</h1>
                </div>
            </main>
        );
    }

    return (
        <main className="all-content">
            <div className="grid col-12 justify-content-center mb-5">
                <h1>{profileUser?.name} </h1>
            </div>
            <div className="mb-5">
                <Button type="button" outlined label="Omistetut" className="p-button-primary mr-2"
                    onClick={() => setCurrentContent(0)} icon="pi pi-star-fill" />
                <Button type="button" outlined label="Muistilista" className="p-button-primary mr-2"
                    icon="pi pi-bookmark-fill"
                    onClick={() => setCurrentContent(1)} />
                <Button type="button" outlined label="Luetut" className="p-button-primary mr-2"
                    icon="pi pi-check-circle"
                    onClick={() => setCurrentContent(4)} />
                <Button type="button" outlined label="Tilastoja" className="p-button-primary mr-2" icon="fa-solid fa-chart-line"
                    onClick={() => setCurrentContent(2)} />
                <Button type="button" outlined label="Kokoelman arvo" className="p-button-primary mr-2"
                    icon="pi pi-euro"
                    onClick={() => setCollectionStatsVisible(true)} />
            </div>
            {currentContent === 0 ? <OwnedBooks userId={profileId} listType="owned" /> : null}
            {currentContent === 1 ? <OwnedBooks userId={profileId} listType="wishlist" /> : null}
            {currentContent === 2 ? <UserStats userId={profileId} /> : null}
            {currentContent === 4 ? <ReadBooks userId={profileId} /> : null}
            <CollectionStatsDialog
                userId={profileId}
                visible={collectionStatsVisible}
                onHide={() => setCollectionStatsVisible(false)}
            />
        </main >
    );
}

export default ProfilePage;