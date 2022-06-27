import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { IWork } from "./Work";
import { ICountry } from "./Country";
import { ContributorBookControl } from "./BookControl";
import { IEdition } from './Edition';
import { IArticle } from './Article';
import { IShort } from './Short';
import { ShortsControl } from './ShortsControl';
import { GenreGroup, IGenre } from './Genre';
import { TagGroup } from './SFTag';
import { ILink } from './Link';
import { LinkPanel } from './Links';
import { AwardPanel, IAwarded } from './Awarded';
import { ProgressSpinner } from "primereact/progressspinner";
import { Fieldset } from 'primereact/fieldset';
import _ from "lodash";
interface INationality {
    id: number,
    name: string
}

export interface IPerson {
    id: number,
    name: string,
    aliases: IPerson[],
    alt_name: string,
    fullname: string,
    image_src: string,
    dob: number,
    dod: number,
    bio: string,
    links: ILink[],
    roles: string[],
    nationality: INationality,
    works: IWork[],
    translations: IEdition[],
    edits: IEdition[],
    articles: IArticle[],
    stories: IShort[],
    magazine_stories: IShort[],
    awarded: IAwarded[],
}

export interface IPersonBrief {
    id: number,
    name: string,
    alt_name: string,
    image_src: string
}

const baseURL = "people/";

export const Person = () => {
    const params = useParams();
    const user = getCurrenUser();
    const [person, setPerson]: [IPerson | null, (person: IPerson) => void] = React.useState<IPerson | null>(null);
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

    return (
        <main className="mt-5">
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
                                <div className="grid col-12 mt-1 mb-0 p-0 justify-content-center">
                                    <h2 className="grid mb-2 p-1">
                                        {personDetails(person.nationality, person.dob, person.dod)}
                                    </h2>
                                </div>
                                {person.aliases.length > 0 &&
                                    <div className="grid col-12 mt-0 p-2 justify-content-center">
                                        <h3 className="grid mb-5">
                                            {person.aliases.length === 1 ? (
                                                "Julkaissut myös nimellä ")
                                                : ("Julkaissut myös nimillä ")
                                            }
                                            {person.aliases.map(alias =>
                                                alias.alt_name ? alias.alt_name : alias.name).join(", ")}.
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
                                <div className="grid col-6 p-3 justify-content-end">
                                    <AwardPanel awards={[...person.awarded, ...workAwards()]}></AwardPanel>
                                </div>
                                <div className="grid col-6 p-3 justify-content-start">
                                    <LinkPanel links={person.links} />
                                </div>
                            </div>
                            <div className="col-12">
                                <ContributorBookControl viewNonSf={false} person={person}></ContributorBookControl>
                                {(person.stories.length > 0 || person.magazine_stories.length > 0) &&
                                    <ShortsControl key={"sfshorts"} person={person} listPublications what={"sf"}></ShortsControl>
                                }
                                {hasNonSf("all") && <Fieldset legend="Ei-SF/Mainstream" toggleable collapsed>
                                    {hasNonSf("works") &&
                                        <ContributorBookControl viewNonSf={true} person={person}></ContributorBookControl>
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