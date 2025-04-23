import React, { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProgressSpinner } from "primereact/progressspinner";
import { Fieldset } from 'primereact/fieldset';
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import _ from "lodash";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { Country } from "../../../types/country";
import { ContributorBookControl } from "../../../components/contributor-book-control";
import { ShortsControl } from '../../short';
import { GenreGroup } from "../../genre";
import { Genre } from "../../genre";
import { TagGroup } from '../../tag';
import { LinkPanel } from "../../../components/link-panel";
import { AwardList, AwardPanel, Awarded } from '../../award';
import { Person, PersonBrief } from '../types';
import { PersonForm } from '../components/person-form';
import { selectId } from '../../../utils';
import { User, isAdmin } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';

//import { AwardedForm } from '@features/award/components/awarded-form';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { BookSeriesList } from '@features/bookseries';
import { getCountryCode } from '../../../utils/country-utils';
import { Toast } from 'primereact/toast';
import { PersonDetails } from '../components/person-details';
import { AwardedForm } from '@features/award/components/awarded-form';

const baseURL = "people/";

interface PersonPageProps {
    id: string | null;
}

let thisId = "";

export const PersonPage = ({ id }: PersonPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [editPerson, setEditPerson] = useState(true);
    const [formData, setFormData]: [Person | null, (formData: Person | null) => void] = useState<Person | null>(null);
    const [showNonSf, setShowNonSf] = useState(false);
    const [isAwardsVisible, setAwardsVisible] = useState(false);
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
        }
    ]

    const personDetails = (nationality: Country | null, dob: number | null, dod: number | null) => {
        let retval: string = "";
        if (nationality) {
            retval = nationality.name
        }
        if (dob) {
            if (nationality) {
                retval = retval + ', '
            }
            retval = retval + dob + '-'
        }
        if (dod) {
            if (!dob) {
                retval = retval + ' - '
            }
            retval = retval + dod
        }
        return retval;
    }


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

    const getWorkAwards = async () => {
        // Return a list of all awards to works awarded to this person.
        // List is automatically sorted by year in ascending order.
        // if (!data) return [];
        // const retval = data.works
        //     .filter(work => work.awards && work.awards.length > 0)
        //     .map(work => work.awards).flat()
        //     .sort((a: Awarded, b: Awarded) => a.year < b.year ? -1 : 1);
        const sorted = fetchPersonAwards(thisId, user).then((response) => {
            const sortedAwards = response.sort((a: Awarded, b: Awarded) => a.year < b.year ? -1 : 1);
            return sortedAwards;
        }, onError => {
            console.log(onError);
        });
        return sorted;
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

    const hasBooks = (data: Person) => {
        return (data.works.length > 0 || data.editions.length > 0);
    }

    const hasShorts = (data: Person) => {
        return (data.stories.length > 0);
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

    const countGenres = (genres: Genre[]) => {
        return genres.reduce((acc: { [key: string]: { name: string, count: number } }, genre) => {
            if (!acc[genre.id]) {
                acc[genre.id] = { name: genre.name, count: 0 };
            }
            acc[genre.id].count++;
            return acc;
        }, {});
    };

    const countTags = (tags: { id: number, name: string }[]) => {
        return tags.reduce((acc: { [key: string]: { name: string, count: number } }, tag) => {
            if (!acc[tag.id]) {
                acc[tag.id] = { name: tag.name, count: 0 };
            }
            acc[tag.id].count++;
            return acc;
        }, {});
    };

    if (!data) {
        return <ProgressSpinner />
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
                                            <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                            <GenreGroup
                                                genres={getGenres()}
                                                showOneCount
                                                className="flex-wrap"
                                            />
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
                                <TabPanel header="Teokset" leftIcon="pi pi-book">
                                    <div className="card">
                                        {/* Existing ContributorBookControl */}
                                        <ContributorBookControl
                                            viewNonSf={false}
                                            person={data}
                                            collaborationsLast={true}
                                            tags={getTags()}  // Add this line
                                        />
                                    </div>
                                </TabPanel>
                                {data.stories && data.stories.length > 0 && (
                                    <TabPanel header="Novellit" leftIcon="pi pi-list">
                                        <div className="card">
                                            <ShortsControl key={"sfshorts"}
                                                person={data}
                                                listPublications
                                                showAuthors
                                                sort={"Title"}
                                                what={"sf"}></ShortsControl>
                                        </div>
                                    </TabPanel>
                                )}
                                {data.works && data.works.some(work => work.bookseries) && (
                                    <TabPanel header="Sarjat" leftIcon="pi pi-sitemap">
                                        <div className="card">
                                            <BookSeriesList
                                                works={data.works}
                                                seriesType='bookseries'
                                            />
                                        </div>
                                    </TabPanel>
                                )}
                                {awards && awards.length > 0 && (
                                    <TabPanel header="Palkinnot" leftIcon="pi pi-trophy">
                                        <AwardList awards={awards}></AwardList>
                                    </TabPanel>
                                )}

                                {hasNonSf("all") && (
                                    <TabPanel header="Muu tuotanto" leftIcon="pi pi-folder">
                                        <div className="card">
                                            {hasNonSf("works") && (
                                                <div className="mb-4">
                                                    <h3 className="text-xl mb-3">Kirjat</h3>
                                                    <ContributorBookControl
                                                        viewNonSf={true}
                                                        person={data}
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
                                )}
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
                        <Dialog maximizable blockScroll
                            className="w-full lg:w-6"
                            header="Palkintojen muokkaus" visible={isAwardsVisible}
                            onShow={() => onAwardsShow()}
                            onHide={() => onAwardsHide()}
                            closeOnEscape
                        >
                            <AwardedForm
                                personId={data.id.toString()}
                            />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
};