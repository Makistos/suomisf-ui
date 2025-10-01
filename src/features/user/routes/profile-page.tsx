import React, { useMemo, useState } from 'react';
import { getCurrenUser } from "../../../services/auth-service";
import { OwnedBooks } from '../components/owned-books';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { selectId } from '@utils/select-id';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { UserStats } from '../components/user-stats';
import { getApiContent, postApiContent } from '@services/user-service';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';
import { Contribution } from '../../../types/contribution';

interface UserPageProps {
    id: string | null;
}

interface RandomWorkFormData {
    count: number;
    description: boolean;
    tags: boolean;
    genres: boolean;
    language: boolean;
    links: boolean;
    stories: boolean;
    page_count: boolean;
    size: boolean;
    binding: boolean;
    image: boolean;
}

const ProfilePage = ({ id }: UserPageProps) => {
    const params = useParams();
    const navigate = useNavigate();
    const currentUser = useMemo(() => { return getCurrenUser() }, []);
    const [currentContent, setCurrentContent] = useState<number>(0);
    const [isLoadingRandomWork, setIsLoadingRandomWork] = useState<boolean>(false);
    const [randomWorkResults, setRandomWorkResults] = useState<any[]>([]);
    const [formData, setFormData] = useState<RandomWorkFormData>({
        count: 10,
        description: false,
        tags: false,
        genres: false,
        language: false,
        links: false,
        stories: false,
        page_count: false,
        size: false,
        binding: false,
        image: false,
    });
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

    const handleRandomIncompleteWork = () => {
        setCurrentContent(3);
    };

    const handleFormSubmit = async () => {
        setIsLoadingRandomWork(true);
        try {
            // Build the missing_fields array based on checked checkboxes
            const missingFields: string[] = [];
            if (formData.description) missingFields.push('description');
            if (formData.tags) missingFields.push('tags');
            if (formData.genres) missingFields.push('genres');
            if (formData.language) missingFields.push('language');
            if (formData.links) missingFields.push('links');
            if (formData.stories) missingFields.push('stories');
            if (formData.page_count) missingFields.push('page_count');
            if (formData.size) missingFields.push('size');
            if (formData.binding) missingFields.push('binding');
            if (formData.image) missingFields.push('image');

            const requestBody = {
                count: formData.count,
                missing_fields: missingFields
            };

            // console.log('Request body:', requestBody);
            // console.log('Form data:', formData);

            const response = await postApiContent('works/random/incomplete', requestBody, currentUser);
            // console.log('Random work response:', response);

            if (response.response && Array.isArray(response.response)) {
                setRandomWorkResults(response.response);
                // console.log('Results stored:', response.response);
            } else {
                console.error('No work results found in response:', response);
                setRandomWorkResults([]);
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

    const authors = (contributors: Contribution[]) => {
        const authorContributors: Contribution[] = contributors.filter(c => c.role.id === 1);
        if (authorContributors.length === 0) return null;

        return (
            authorContributors.map((contributor, index) => (
                <span key={contributor.person.id}>
                    {contributor.person.name}
                    {index < authorContributors.length - 1 && ', '}
                </span>
            ))
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
                <Button type="button" outlined label="Tilastoja" className="p-button-primary mr-2" icon="fa-solid fa-chart-line"
                    onClick={() => setCurrentContent(2)} />
                {isOwnProfile && (
                    <Button type="button" outlined label="Satunnainen keskeneräinen teos"
                        className="p-button-secondary"
                        icon="pi pi-shuffle"
                        onClick={handleRandomIncompleteWork} />
                )}
            </div>
            {currentContent === 0 ? <OwnedBooks userId={profileId} listType="owned" /> : null}
            {currentContent === 1 ? <OwnedBooks userId={profileId} listType="wishlist" /> : null}
            {currentContent === 2 ? <UserStats userId={profileId} /> : null}
            {currentContent === 3 ? (
                <div className="p-fluid">
                    <div className="field mb-4">
                        <label htmlFor="count" className="font-bold">Lukumäärä</label>
                        <InputNumber
                            id="count"
                            value={formData.count}
                            onValueChange={(e) => setFormData({ ...formData, count: e.value || 10 })}
                            min={1}
                            max={100}
                            className="mt-2"
                        />
                    </div>

                    <div className="field mb-4">
                        <label className="font-bold mb-3 block">Puuttuvat tiedot:</label>
                        <div className="grid">
                            <div className="col-6">
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="description"
                                        checked={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.checked || false })}
                                    />
                                    <label htmlFor="description" className="ml-2">Kuvaus</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="tags"
                                        checked={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.checked || false })}
                                    />
                                    <label htmlFor="tags" className="ml-2">Asiasanat</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="genres"
                                        checked={formData.genres}
                                        onChange={(e) => setFormData({ ...formData, genres: e.checked || false })}
                                    />
                                    <label htmlFor="genres" className="ml-2">Genret</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="language"
                                        checked={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.checked || false })}
                                    />
                                    <label htmlFor="language" className="ml-2">Kieli</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="links"
                                        checked={formData.links}
                                        onChange={(e) => setFormData({ ...formData, links: e.checked || false })}
                                    />
                                    <label htmlFor="links" className="ml-2">Linkit</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="stories"
                                        checked={formData.stories}
                                        onChange={(e) => setFormData({ ...formData, stories: e.checked || false })}
                                    />
                                    <label htmlFor="stories" className="ml-2">Novellit</label>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="page_count"
                                        checked={formData.page_count}
                                        onChange={(e) => setFormData({ ...formData, page_count: e.checked || false })}
                                    />
                                    <label htmlFor="page_count" className="ml-2">Sivumäärä</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="size"
                                        checked={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.checked || false })}
                                    />
                                    <label htmlFor="size" className="ml-2">Koko</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="binding"
                                        checked={formData.binding}
                                        onChange={(e) => setFormData({ ...formData, binding: e.checked || false })}
                                    />
                                    <label htmlFor="binding" className="ml-2">Sidonta</label>
                                </div>
                                <div className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId="image"
                                        checked={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.checked || false })}
                                    />
                                    <label htmlFor="image" className="ml-2">Kuva</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-content-end gap-2 mb-4">
                        <Button
                            label="Hae teoksia"
                            icon="pi pi-search"
                            loading={isLoadingRandomWork}
                            onClick={handleFormSubmit}
                        />
                    </div>

                    {randomWorkResults.length > 0 && (
                        <div className="mt-4">
                            <h3>Löydetyt teokset:</h3>
                            <div className="mt-3">
                                {randomWorkResults.map((work) => (
                                    <div
                                        key={work.id}
                                        className="p-1 border-round mb-0"
                                    >
                                        <h4 className="mt-0 mb-0">
                                            {authors(work.contributions)}:&nbsp;
                                            <Link to={`/works/${work.id}`} className="no-underline text-primary">
                                                {work.title}
                                            </Link>
                                        </h4>
                                        {work.work_type && (
                                            <span className="text-sm text-600">
                                                {work.work_type.name}. Painoksia: {work.editions.length}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </main >
    );
}

export default ProfilePage;