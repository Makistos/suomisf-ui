import React, { useEffect, useState } from 'react';
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
import { AwardPanel, Awarded } from '../../award';
import { Person, PersonBrief } from '../types';
import { PersonForm } from '../components/person-form';
import { selectId } from '../../../utils';
import { User, isAdmin } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';

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
        //console.log(response);
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

    const workAwards = () => {
        // Return a list of all awards to works awarded to this person.
        // List is automatically sorted by year in ascending order.
        if (!data) return [];
        const retval = data.works
            .filter(work => work.awards && work.awards.length > 0)
            .map(work => work.awards).flat()
            .sort((a: Awarded, b: Awarded) => a.year < b.year ? -1 : 1);
        return retval;
    }

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

    const combineNames = (aliases: PersonBrief[], other_names: string) => {
        //let retval = aliases.map(alias => alias.alt_name ? alias.alt_name : alias.name);
        let retval = aliases.map(alias => alias.alt_name);
        if (other_names) retval.push(other_names);
        return retval.join(', ');
    }

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false);
    }

    const queryClient = useQueryClient();

    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["person", data?.id] });
        setQueryEnabled(true);
        setEditVisible(false);
    }

    // if (data !== undefined) {
    //     console.log(data)
    // }

    return (
        <main className="all-content" id="person-page">
            <div className="mt-5 speeddial style={{ position: 'relative', height: 500px'}}">
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action">
                        </Tooltip>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction="left"
                            type="semi-circle"
                            radius={80}
                        />
                    </div >
                }
                <Dialog maximizable blockScroll
                    className="w-full lg:w-6"
                    header="Henkilön tietojen muokkaus" visible={isEditVisible}
                    onShow={() => onDialogShow()}
                    onHide={() => onDialogHide()}
                >
                    <PersonForm data={!formData || !editPerson ? null : formData} onSubmitCallback={onDialogHide} />
                </Dialog>
                {
                    isLoading ?
                        <div className="progressbar">
                            < ProgressSpinner />
                        </div >
                        : (data && (
                            <div>
                                <div className="grid justify-content-center">
                                    <div className="grid col-12 mt-5 mb-1">
                                        {data.alt_name ? (
                                            <div className="grid col-12 p-0 justify-content-center">
                                                <div className="grid col-12 pb-0 pt-5 mb-0 justify-content-center">
                                                    <h1 className="maintitle">{data.alt_name}</h1>
                                                </div>
                                                {data.fullname && (
                                                    <div className="grid col-12 p-0 mt-0 mb-0 justify-content-center">
                                                        <h2>({data.fullname})</h2>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid col-12 p-0 mt-0 mb-0 justify-content-center">
                                                <h1 className="maintitle">{data.fullname}</h1>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid mt-0 col-12 mb-0 p-0 justify-content-center">
                                        <h2 className="grid">
                                            {personDetails(data.nationality, data.dob, data.dod)}
                                        </h2>
                                    </div>
                                    {((data.aliases && data.aliases.length > 0) || (data.other_names && data.other_names.length > 0)) &&
                                        <div className="grid col-12 mt-0 p-2 justify-content-center">
                                            <h3 className="grid mb-5">
                                                <>Myös{' '}
                                                    {combineNames(data.aliases, data.other_names)}
                                                    .</>
                                            </h3>
                                        </div>
                                    }
                                    {(data.real_names && data.real_names.length > 0) &&
                                        <div className="grid col-12 mt-0 p-2 justify-content-center">
                                            <h3 className="grid mb-5">
                                                <>Oik.{' '}
                                                    {data.real_names.map(name => name.alt_name).join(', ')}
                                                    .</>
                                            </h3>
                                        </div>
                                    }
                                </div>
                                <div className="col-12 mt-2">
                                    <GenreGroup genres={getGenres()} showOneCount></GenreGroup>
                                </div>
                                <div className="col-12 mb-5">
                                    <TagGroup tags={getTags()} overflow={5} showOneCount />
                                </div>
                                <div className="grid col-12 mb-5 justify-content-center">
                                    <div className="grid col-6 pr-3 justify-content-end">
                                        <AwardPanel awards={[...data.awarded, ...workAwards()]}></AwardPanel>
                                    </div>
                                    <div className="grid col-6 pl-3 justify-content-start">
                                        <LinkPanel links={data.links} />
                                    </div>
                                </div>
                                <div className="col-12">
                                    {hasBooks(data) && (
                                        <ContributorBookControl viewNonSf={false} person={data}
                                            collaborationsLast={true}></ContributorBookControl>
                                    )}
                                    {hasShorts(data) &&
                                        <ShortsControl key={"sfshorts"}
                                            person={data}
                                            listPublications
                                            showAuthors
                                            sort={"Author"}
                                            what={"sf"}></ShortsControl>
                                    }
                                    {hasNonSf("all") && <Fieldset legend="Ei-SF/Mainstream" toggleable collapsed>
                                        {hasNonSf("works") &&
                                            <ContributorBookControl viewNonSf={true} person={data}
                                                collaborationsLast={true}></ContributorBookControl>
                                        }
                                        {hasNonSf("stories") &&
                                            <ShortsControl key={"nonsfshorts"}
                                                person={data}
                                                listPublications
                                                showAuthors
                                                sort={"Author"}
                                                what={"nonsf"}></ShortsControl>
                                        }
                                    </Fieldset>
                                    }
                                </div>
                            </div>
                        ))
                }
            </div>
        </main >
    );
}