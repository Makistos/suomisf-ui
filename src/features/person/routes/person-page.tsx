import { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import _ from "lodash";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { ContributorBookControl } from "../../../components/contributor-book-control";
import { ShortsControl } from '../../short';
import { GenreGroup, Genre } from "../../genre";
import { TagGroup } from '../../tag';
import { AwardList, Awarded } from '../../award';
import { Person } from '../types';
import { PersonForm } from '../components/person-form';
import { PersonImagePickerDialog } from '../components/person-image-picker-dialog';
import { selectId } from '../../../utils';
import { User, isAdmin } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { BookSeriesList } from '@features/bookseries';
import { Toast } from 'primereact/toast';
import { PersonDetails } from '../components/person-details';
import { AwardedForm } from '@features/award/components/awarded-form';
import { ContributorMagazineControl } from '@components/contributor-magazine-control';
import { Issue } from '@features/issue';
import { ContributionType } from '../../../types/contribution';

const baseURL = "people/";

interface PersonPageProps {
    id: string | null;
}

let thisId = "";

const FICTION_TYPES = [1, 2, 5, 6];
const NONFICTION_TYPES = [4];

export const PersonPage = ({ id }: PersonPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [editPerson, setEditPerson] = useState(true);
    const [formData, setFormData]: [Person | null, (formData: Person | null) => void] = useState<Person | null>(null);
    const [isAwardsVisible, setAwardsVisible] = useState(false);
    const [isImagePickerVisible, setImagePickerVisible] = useState(false);
    //const [workAwards, setWorkAwards]: [Awarded[], (workAwards: Awarded[]) => void] = useState<Awarded[]>([]);
    //let workAwards: Awarded[] = [];
    const toastRef = useRef<Toast>(null);

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} person`);
    }
    const fetchPerson = async (id: string, user: User | null): Promise<Person> => {
        const url = baseURL + id;
        const response = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        // console.log(response);
        return response;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["person", thisId],
        queryFn: () => fetchPerson(thisId, user),
        enabled: queryEnabled
    });

    const issueContributions = useQuery<Issue[]>({
        queryKey: ["person", thisId, "magazineContributions"],
        queryFn: async () => {
            const url = baseURL + thisId + "/issue-contributions";
            const response = await getApiContent(url, user).then(response =>
                response.data
            )
                .catch((error) => console.log(error));
            return response == undefined ? [] : response;
        },
        placeholderData: [],
    });

    useEffect(() => {
        if (data !== undefined)
            setDocumentTitle(data.name);
    }, [data])

    const dialItems = [
        {
            label: 'Uusi henkilö',
            icon: "fa-solid fa-circle-plus",
            command: () => {
                setEditPerson(false);
                setFormData(null);
                setEditVisible(true);
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                if (data) {
                    setEditPerson(true);
                    setFormData(data);
                    setEditVisible(true);
                }
            }
        },
        {
            label: 'Palkinnot',
            icon: 'fa-solid fa-trophy',
            command: () => {
                setAwardsVisible(true);

            }
        },
        {
            label: 'Kuva',
            icon: 'fa-solid fa-image',
            command: () => setImagePickerVisible(true)
        }
    ]

    const getGenres = () => {
        if (!data) return [];
        return data.works.map(work => work.genres).flat();
    }
    const getTags = () => {
        if (!data) return [];
        return data.works.map(work => work.tags).flat();
    }

    const fetchPersonAwards = async (id: string, user: User | null): Promise<Awarded[]> => {
        const url = baseURL + id + "/awarded";
        const response = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        //console.log(response);
        return response == undefined ? [] : response;
    }

    const { data: awards } = useQuery({
        queryKey: ["workAwards", thisId],
        queryFn: () => fetchPersonAwards(thisId, user),
        enabled: queryEnabled,
        // onSuccess: (data: Awarded[]) => {
        //     setWorkAwards(data);
        // },
    });

    const hasNonSf = (what: string) => {
        /**
         * Check if person has any non-SF content in database (works, shorts).
         */
        if (!data) return false;

        if ((data.works === null || data.works.length === 0) &&
            (data.stories === null || data.stories.length === 0)) return false;
        let all_genres: Genre[] = [];
        if (what === "all" || what === "works") {
            all_genres = _.concat(all_genres, data.works.map(work => work.genres))
        }
        if (what === "all" || what === "stories") {
            all_genres = _.concat(all_genres,
                ...data.stories.map(story => story.genres));
        }
        return _.flatten(all_genres).some(genre => genre.abbr === 'eiSF');
    }

    const getDerivedRoles = (data: Person, issues: Issue[]): string[] => {
        const roles: string[] = [];

        const authoredShorts = (data.stories || []).filter(s =>
            (s.contributors || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Kirjoittaja)
        );
        const isNovellisti = authoredShorts.some(s => s.type && [1, 2, 3, 5].includes(s.type.id));
        const isRunoilija = authoredShorts.some(s => s.type && [4, 6].includes(s.type.id));
        const isKirjoittaja = authoredShorts.some(s => s.type && [7, 8, 9].includes(s.type.id));

        if (data.works.length > 0) roles.push('Kirjailija');
        if (isNovellisti) roles.push('Novellisti');
        if (isRunoilija) roles.push('Runoilija');
        if (isKirjoittaja) roles.push('Kirjoittaja');

        const hasTranslatedBooks = (data.editions || []).some(e =>
            (e.contributions || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Kääntäjä)
        );
        const hasTranslatedShorts = (data.stories || []).some(s =>
            (s.contributors || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Kääntäjä)
        );
        if (hasTranslatedBooks || hasTranslatedShorts) roles.push('Kääntäjä');
        if (data.edits && data.edits.length > 0) roles.push('Toimittaja');

        const editions = data.editions || [];
        if (editions.some(e => (e.contributions || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Kansikuva)))
            roles.push('Kansitaiteilija');
        if (editions.some(e => (e.contributions || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Kuvittaja)))
            roles.push('Kuvittaja');
        if (issues.some(i => (i.contributors || []).some(c => c.person.id === data.id && c.role.id === ContributionType.Päätoimittaja)))
            roles.push('Päätoimittaja');

        const order = ['Kirjailija', 'Kirjoittaja', 'Kääntäjä', 'Toimittaja', 'Novellisti', 'Runoilija', 'Kansitaiteilija', 'Kuvittaja', 'Päätoimittaja'];
        return roles.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }

    const queryClient = useQueryClient();

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false);
    }

    const onAwardsShow = () => {
        // sstory_updateetAwardsVisible(true);
        // setQueryEnabled(false);
    }

    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["person", data?.id] });
        setQueryEnabled(true);
        setEditVisible(false);
    }

    const onAwardsHide = () => {
        queryClient.invalidateQueries({ queryKey: ["person", data?.id] });
        // setQueryEnabled(true);
        setAwardsVisible(false);
    }
    // if (data !== undefined) {
    //     console.log(data)
    // }

    if (!data) return null;

    const hasFictionType = (types: Number[]) => {
        // console.log(data)
        return data.works.filter(work => types.includes(work.work_type.id)).length > 0 ||
            data.editions.filter(edition => edition.work && types.includes(edition.work.work_type.id)).length > 0 ||
            data.edits.filter(edition => edition.work && types.includes(edition.work.work_type.id)).length > 0
    }

    return (
        <main className="person-page">
            <Toast ref={toastRef} />

            {isLoading ? (
                <div className="flex justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                data && (
                    <div className="grid">
                        {/* Header Section */}
                        <div className="col-12">
                            <Card className="shadow-3">
                                <div className="grid pl-2 pr-2 pt-0">
                                    <div className="col-12 lg:col-9">
                                        <div className="flex-column">
                                            <PersonDetails person={data} />
                                        </div>
                                    </div>

                                    {/* Genres moved to right side */}
                                    <div className="col-12 lg:col-3">  {/* Full width on mobile, 3 cols on large screens */}
                                        <div className="flex flex-column gap-4">
                                            {getDerivedRoles(data, issueContributions.data || []).length > 0 && (
                                                <div className="flex flex-column gap-2 pt-3 border-bottom-1">
                                                    <span className="font-bold">{getDerivedRoles(data, issueContributions.data || []).join(', ')}</span>
                                                </div>
                                            )}
                                            {getGenres().length > 0 && (
                                                <div className="flex flex-column gap-2">
                                                    <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                                    <GenreGroup
                                                        genres={getGenres()}
                                                        showOneCount
                                                        className="flex-wrap"
                                                    />
                                                </div>
                                            )}
                                            {getTags().length > 0 && (
                                                <div className="flex flex-column gap-2">
                                                    <h3 className="text-sm uppercase text-600 m-0">Asiasanat</h3>
                                                    <TagGroup
                                                        tags={getTags()}
                                                        overflow={5}
                                                        showOneCount
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Links section */}
                                {data.links && data.links.length > 0 && (
                                    <div className="mt-4 pt-3 border-top-1 surface-border">
                                        <div className="flex flex-wrap gap-3">
                                            {data.links.map((link, index) => (
                                                <a
                                                    key={index}
                                                    href={link.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="no-underline text-primary hover:text-primary-700 flex align-items-center gap-2"
                                                >
                                                    <i className="pi pi-external-link" />
                                                    <span>{link.description}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="col-12">
                            <TabView className="shadow-2" scrollable={true}>
                                {[
                                    hasFictionType(FICTION_TYPES) && (
                                        <TabPanel key="teokset" header="Teokset" leftIcon="pi pi-book">
                                            <div className="card">
                                                <ContributorBookControl
                                                    viewNonSf={false}
                                                    person={data}
                                                    types={FICTION_TYPES}
                                                    collaborationsLast={true}
                                                />
                                            </div>
                                        </TabPanel>
                                    ),
                                    hasFictionType(NONFICTION_TYPES) && (
                                        <TabPanel key="tietokirjat" header="Tietokirjat" leftIcon="pi pi-book">
                                            <div className="card">
                                                <ContributorBookControl
                                                    viewNonSf={false}
                                                    person={data}
                                                    types={NONFICTION_TYPES}
                                                    collaborationsLast={true}
                                                />
                                            </div>
                                        </TabPanel>
                                    ),
                                    data.stories && data.stories.length > 0 && (
                                        <TabPanel key="novellit" header="Novellit ja artikkelit" leftIcon="pi pi-list">
                                            <div className="card">
                                                <ShortsControl key={"sfshorts"}
                                                    person={data}
                                                    listPublications
                                                    showAuthors
                                                    sort={"Title"}
                                                    what={"sf"} />
                                            </div>
                                        </TabPanel>
                                    ),
                                    data.works && data.works.some(work => work.bookseries) && (
                                        <TabPanel key="sarjat" header="Sarjat" leftIcon="pi pi-sitemap">
                                            <div className="card">
                                                <BookSeriesList
                                                    works={data.works}
                                                    seriesType='bookseries'
                                                />
                                            </div>
                                        </TabPanel>
                                    ),
                                    issueContributions.data && issueContributions.data.length > 0 && (
                                        <TabPanel key="lehdet" header="Lehdet" leftIcon="pi pi-newspaper">
                                            <div className="card">
                                                <ContributorMagazineControl
                                                    issues={issueContributions.data}
                                                    person={data.id}
                                                />
                                            </div>
                                        </TabPanel>
                                    ),
                                    awards && awards.length > 0 && (
                                        <TabPanel key="palkinnot" header="Palkinnot" leftIcon="pi pi-trophy">
                                            <div className="card">
                                                <AwardList awards={awards} />
                                            </div>
                                        </TabPanel>
                                    ),
                                    hasNonSf("all") && (
                                        <TabPanel key="muutuotanto" header="Muu tuotanto" leftIcon="pi pi-folder">
                                        <div className="card">
                                            {hasNonSf("works") && (
                                                <div className="mb-4">
                                                    <h3 className="text-xl mb-3">Kirjat</h3>
                                                    <ContributorBookControl
                                                        viewNonSf={true}
                                                        person={data}
                                                        types={[1, 2, 3, 4, 5, 6]}
                                                        collaborationsLast={true}
                                                    />
                                                </div>
                                            )}
                                            {hasNonSf("stories") && (
                                                <div>
                                                    <h3 className="text-xl mb-3">Novellit</h3>
                                                    <ShortsControl
                                                        key={"nonsfshorts"}
                                                        person={data}
                                                        listPublications
                                                        showAuthors
                                                        sort={"Author"}
                                                        what={"nonsf"}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TabPanel>
                                    ),
                                ].filter(Boolean)}
                            </TabView>
                        </div>

                        {/* Dialogs */}
                        {isAdmin(user) && (
                            <>
                                <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
                                <SpeedDial
                                    model={dialItems}
                                    direction="up"
                                    className="fixed-dial"
                                    showIcon="pi pi-plus"
                                    hideIcon="pi pi-times"
                                    buttonClassName="p-button-primary"
                                />
                            </>
                        )}

                        <Dialog maximizable blockScroll
                            className="w-full lg:w-6"
                            header="Henkilön tietojen muokkaus" visible={isEditVisible}
                            onShow={() => onDialogShow()}
                            onHide={() => onDialogHide()}
                        >
                            <PersonForm data={!formData || !editPerson ? null : formData} onSubmitCallback={onDialogHide} />
                        </Dialog>
                        <PersonImagePickerDialog
                            person={data}
                            visible={isImagePickerVisible}
                            onHide={() => setImagePickerVisible(false)}
                            onSave={() => queryClient.invalidateQueries({ queryKey: ["person", thisId] })}
                        />
                        <Dialog maximizable blockScroll
                            className="w-full lg:w-6"
                            header="Palkintojen muokkaus" visible={isAwardsVisible}
                            onShow={() => onAwardsShow()}
                            onHide={() => onAwardsHide()}
                            closeOnEscape
                        >
                            <AwardedForm
                                personId={data.id.toString()}
                                onClose={() => onAwardsHide()}
                            />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
};