import React, { useMemo, useState } from 'react';

import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';
import { useParams, useNavigate } from 'react-router-dom';
import { selectId } from '@utils/select-id';
import { Button } from 'primereact/button';
import { UserStats } from '../components/user-stats';
import { getApiContent } from '@services/user-service';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';

interface UserPageProps {
    id: string | null;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const params = useParams();
    const navigate = useNavigate();
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    const [currentContent, setCurrentContent] = useState<number>(0);
    const [isLoadingRandomWork, setIsLoadingRandomWork] = useState<boolean>(false);
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

    const handleRandomIncompleteWork = async () => {
        setIsLoadingRandomWork(true);
        try {
            const response = await getApiContent('works/random/incomplete', currentUser);
            console.log('Random work response:', response);
            if (response.data && response.data.id) {
                console.log('Navigating to work:', response.data.id);
                navigate(`/works/${response.data.id}`);
            } else {
                console.error('No work data or ID found in response:', response);
            }
        } catch (error) {
            console.error('Error fetching random incomplete work:', error);
        } finally {
            setIsLoadingRandomWork(false);
        }
    };

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

    // Check if current user is viewing their own profile
    const isOwnProfile = currentUser?.id?.toString() === profileId;

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
                <Button type="button" outlined label="Tilastoja" className="p-button-primary mr-2" icon="fa-solid fa-chart-line"
                    onClick={() => setCurrentContent(2)} />
                {isOwnProfile && (
                    <Button type="button" outlined label="Satunnainen keskeneräinen teos"
                        className="p-button-secondary"
                        icon="pi pi-shuffle"
                        loading={isLoadingRandomWork}
                        onClick={handleRandomIncompleteWork} />
                )}
            </div>
            {currentContent === 0 ? <OwnedBooks userId={profileId} listType="owned" /> : null}
            {currentContent === 1 ? <OwnedBooks userId={profileId} listType="wishlist" /> : null}
            {currentContent === 2 ? <UserStats userId={profileId} /> : null}
        </main >
    );
}

export default ProfilePage;