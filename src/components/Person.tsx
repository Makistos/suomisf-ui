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
import { GenreGroup } from './Genre';
import { TagGroup } from './SFTag';
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
    const [person, setPerson]: [IPerson | null, (person: IPerson) => void] = React.useState<IPerson | null>(null);
    React.useEffect(() => {
        async function getPerson() {
            let url = baseURL + params.personId?.toString();
            try {
                const response = await getApiContent(url, user);
                setPerson(response.data);
                //console.log(person);
            } catch (e) {
                console.error(e);
            }
        }
        getPerson();
        //console.log(person);
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


    const getGenres = () => {
        return person.works.map(work => work.genres).flat();
    }
    const getTags = () => {
        return person.works.map(work => work.tags).flat();
    }

    return (
        <main className="mt-5">
            {person !== undefined ? (
                <div className="grid align-items-center justify-content-center mt-5">
                    <div className="col-12 p-0 justify-content-center">
                        {person.alt_name ? (
                            <h1 className="personname justify-content-center">{person.alt_name}</h1>
                        ) : (
                            <h1 className="personname justify-content-center">{person.fullname}</h1>
                        )}
                    </div>
                    <div className="col-12 p-0">
                        {person.fullname &&
                            <h2 className="personname">({person.fullname})</h2>
                        }
                    </div>
                    <div className="col-12 mb-2">
                        <h2 className="persondetails">
                            {personDetails(person.nationality, person.dob, person.dod)}
                        </h2>
                    </div>
                    <div className="col-12">
                        <GenreGroup genres={getGenres()} showOneCount></GenreGroup>
                    </div>
                    <div className="col-12 mb-5">
                        <TagGroup tags={getTags()} overflow={5} showOneCount />
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