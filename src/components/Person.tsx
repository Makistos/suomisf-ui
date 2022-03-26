import React from 'react';
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { IWork } from "./Work";
import { ICountry } from "./Country";
import { ContributorBookControl } from "./BookControl";
import { IEdition } from './Edition';
import { IArticle } from './Article';

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
    articles: IArticle[]

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
                //console.log(works);
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

    return (
        <main>
            {person !== undefined ? (
                <div>
                    {person.alt_name ? (
                        <h1 className="personname">{person.alt_name}</h1>
                    ) : (
                        <h1 className="personname">{person.fullname}</h1>
                    )}
                    {person.fullname &&
                        <h2 className="personname">({person.fullname})</h2>
                    }
                    <h2 className="persondetails">
                        {personDetails(person.nationality, person.dob, person.dod)}
                    </h2>
                    <ContributorBookControl person={person}></ContributorBookControl>
                </div>
            ) : (
                <p>Haetaan tietoja...</p>
            )}
        </main>
    );
}