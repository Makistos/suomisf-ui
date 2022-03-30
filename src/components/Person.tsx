import React from 'react';
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
import { GenreCount, IGenre } from './Genre';
import { TagCount, ITag } from './SFTag';

interface INationality {
    id: number,
    name: string
}
export interface IPerson {
    id: number,
    name: string,
    alt_name: string,
    fullname: string,
    image_src: string,
    dob: number,
    dod: number,
    bio: string,
    roles: string[],
    nationality: INationality,
    works: IWork[],
    translations: IEdition[],
    edits: IEdition[],
    articles: IArticle[],
    stories: IShort[],
    magazine_stories: IShort[]
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
    //const defaultWorks: IWork[] = [];
    const [person, setPerson]: [IPerson | null, (person: IPerson) => void] = React.useState<IPerson | null>(null);
    //const [dbworks, setDbWorks]: [IWork[], (works: IWork[]) => void] = React.useState(defaultWorks);
    //const [workGrouping, setWorkGrouping]: [string, (workGrouping: string) => void] = React.useState("author_str");
    //const [works, setWorks]: [Record<string, IWork[]>, (works: Record<string, IWork[]>) => void] = React.useState({});
    React.useEffect(() => {
        async function getPerson() {
            let url = baseURL + params.personId?.toString();
            try {
                const response = await getApiContent(url, user);
                setPerson(response.data);
                //setDbWorks(response.data.works);
                //setWorks(orderWorks(response.data.works));
                //console.log(person);
            } catch (e) {
                console.error(e);
            }
        }
        getPerson();
    }, [params.personId, user])

    if (!person) return null;

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

    const genreCounts = () => {
        let retval = person.works.reduce((acc: Record<string, number>, work: IWork) => {
            work.genres.map((genre: IGenre) => {
                const genreName: string = genre.name;
                if (!acc[genreName]) {
                    acc[genreName] = 1;
                } else {
                    acc[genreName]++;
                }
            })
            return acc;
        }, {} as Record<string, number>)
        return retval;
    }

    const tagCounts = () => {
        let retval = person.works.reduce((acc: Record<string, number>, work: IWork) => {
            work.tags.map((tag: ITag) => {
                const tagName: string = tag.name;
                if (!acc[tagName]) {
                    acc[tagName] = 1;
                } else {
                    acc[tagName]++;
                }
            })
            return acc;
        }, {} as Record<string, number>)
        console.log(retval);
        return retval;

    }
    return (
        <main>
            {person !== undefined ? (
                <div className="grid align-items-center justify-content-center">
                    <div className="col-12 p-0">
                        {person.alt_name ? (
                            <h1 className="personname">{person.alt_name}</h1>
                        ) : (
                            <h1 className="personname">{person.fullname}</h1>
                        )}
                    </div>
                    <div className="col-12 p-0">
                        {person.fullname &&
                            <h2 className="personname">({person.fullname})</h2>
                        }
                    </div>
                    <div className="col-12">
                        <h2 className="persondetails">
                            {personDetails(person.nationality, person.dob, person.dod)}
                        </h2>
                    </div>
                    <div className="col-12">
                        <div className="flex justify-content-center">
                            {Object.entries(genreCounts()).sort((a, b) => a[1] > b[1] ? -1 : 1)
                                .map(genre =>
                                    <span key={genre[0]} className="mr-1">
                                        <GenreCount genre={genre[0]} count={genre[1]} />
                                    </span>
                                )}
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="flex justify-content-center flex-wrap">
                            {Object.entries(tagCounts()).sort((a, b) => a[1] > b[1] ? -1 : 1)
                                .map(tag =>
                                    <span key={tag[0]} className="mr-1 mb-1">
                                        <TagCount tag={tag[0]} count={tag[1]} />
                                    </span>
                                )}
                        </div>
                    </div>
                    <div className="col-12">
                        <ContributorBookControl person={person}></ContributorBookControl>
                        <ShortsControl person={person}></ShortsControl>
                    </div>
                </div>
            ) : (
                <p>Haetaan tietoja...</p>
            )
            }
        </main >
    );
}