import React, { useState } from 'react';
import { useParams } from "react-router-dom";

import { ProgressSpinner } from "primereact/progressspinner";
import { Fieldset } from 'primereact/fieldset';
import _ from "lodash";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { ICountry } from "../../../components/Country";
import { ContributorBookControl } from "../../../components/BookControl";
import { ShortsControl } from '../../Short/ShortsControl';
import { GenreGroup, IGenre } from '../../../components/Genre';
import { TagGroup } from '../../../components/Tag/SFTagGroup';
import { LinkPanel } from '../../../components/Links';
import { AwardPanel, IAwarded } from '../../Award/Awarded';
import { Person } from '../types';

const baseURL = "people/";

export const PersonPage = () => {
    const params = useParams();
    const user = getCurrenUser();
    const [person, setPerson]: [Person | null, (person: Person) => void] = React.useState<Person | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        async function getPerson() {
            let url = baseURL + params.personId?.toString();
            try {
                const response = await getApiContent(url, user);
                setPerson(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getPerson();
    }, [params.personId, user])

    const personDetails = (nationality: ICountry | null, dob: number | null, dod: number | null) => {
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
        if (!person) return [];
        return person.works.map(work => work.genres).flat();
    }
    const getTags = () => {
        if (!person) return [];
        return person.works.map(work => work.tags).flat();
    }

    const workAwards = () => {
        // Return a list of all awards to works awarded to this person.
        // List is automatically sorted by year in ascending order.
        if (!person) return [];
        const retval = person.works
            .filter(work => work.awards && work.awards.length > 0)
            .map(work => work.awards).flat()
            .sort((a: IAwarded, b: IAwarded) => a.year < b.year ? -1 : 1);
        return retval;
    }

    const hasNonSf = (what: string) => {
        /**
         * Check if person has any non-SF content in database (works, shorts).
         */
        if (person === null) return false;
        let all_genres: IGenre[] = [];
        if (what === "all" || what === "works") {
            all_genres = _.concat(all_genres, person.works.map(work => work.genres))
        }
        if (what === "all" || what === "stories") {
            all_genres = _.concat(all_genres,
                ...person.stories.map(story => story.genres),
                ...person.magazine_stories.map(story => story.genres));
        }
        return _.flatten(all_genres).some(genre => genre.abbr === 'eiSF');
    }

    const combineNames = (aliases: Person[], other_names: string) => {
        let retval = aliases.map(alias => alias.alt_name ? alias.alt_name : alias.name);
        if (other_names) retval.push(other_names);
        return retval.join(', ');
    }

    return (
        <main className="all-content">
            {
                loading ?
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                    : (person && (
                        <div>
                            <div className="grid justify-content-center">
                                <div className="grid col-12 mt-5 mb-1">
                                    {person.alt_name ? (
                                        <div className="grid col-12 p-0 justify-content-center">
                                            <div className="grid col-12 pb-0 pt-5 mb-0 justify-content-center">
                                                <h1 className="maintitle">{person.alt_name}</h1>
                                            </div>
                                            {person.fullname && (
                                                <div className="grid col-12 p-0 mt-0 mb-0 justify-content-center">
                                                    <h2>({person.fullname})</h2>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid col-12 p-0 mt-0 mb-0 justify-content-center">
                                            <h1 className="maintitle">{person.fullname}</h1>
                                        </div>
                                    )}
                                </div>
                                <div className="grid mt-0 col-12 mb-0 p-0 justify-content-center">
                                    <h2 className="grid">
                                        {personDetails(person.nationality, person.dob, person.dod)}
                                    </h2>
                                </div>
                                {((person.aliases && person.aliases.length > 0) || (person.other_names && person.other_names.length > 0)) &&
                                    <div className="grid col-12 mt-0 p-2 justify-content-center">
                                        <h3 className="grid mb-5">
                                            <>Myös{' '}
                                                {combineNames(person.aliases, person.other_names)}
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
                                    <AwardPanel awards={[...person.awarded, ...workAwards()]}></AwardPanel>
                                </div>
                                <div className="grid col-6 pl-3 justify-content-start">
                                    <LinkPanel links={person.links} />
                                </div>
                            </div>
                            <div className="col-12">
                                {person.works.length > 0 && (
                                    <ContributorBookControl viewNonSf={false} person={person}
                                        collaborationsLast={true}></ContributorBookControl>
                                )}
                                {(person.stories.length > 0 || person.magazine_stories.length > 0) &&
                                    <ShortsControl key={"sfshorts"} person={person} listPublications what={"sf"}></ShortsControl>
                                }
                                {hasNonSf("all") && <Fieldset legend="Ei-SF/Mainstream" toggleable collapsed>
                                    {hasNonSf("works") &&
                                        <ContributorBookControl viewNonSf={true} person={person}
                                            collaborationsLast={true}></ContributorBookControl>
                                    }
                                    {hasNonSf("stories") &&
                                        <ShortsControl key={"nonsfshorts"} person={person} listPublications what={"nonsf"}></ShortsControl>
                                    }
                                </Fieldset>
                                }
                            </div>
                        </div>
                    )
                    )
            }
        </main >
    );
}