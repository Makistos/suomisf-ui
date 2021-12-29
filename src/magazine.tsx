import React from 'react';
import { getCurrenUser } from "./services/auth-service";
import { getApiContent } from "./services/user-service";
import { useParams, Link } from "react-router-dom";
import { Issue, IIssue } from './Issue';
import { access } from 'fs';
import { Accordion } from 'primereact/accordion';
import { AccordionTab } from 'primereact/accordion';

// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
// import 'primereact/resources/primereact.min.css'
// import './App.css';
// import './index.css';

export interface IMagazine {
    id: number,
    name: string,
    //publisher_id: number,
    description: string,
    link: string,
    issn: string,
    type: number,
    uri: string,
    issues: number[]
}

const baseURL = "magazines/";

const Magazine = () => {

    var issueSort = function (a: IIssue, b: IIssue): number {
        // Prioritize count, this is a running number
        // that doesn't care about years etc.
        if (a.count != null && b.count != null) {
            return a.count - b.count;
        }
        if (a.year != b.year) {
            return a.year - b.year;
        }
        // No count, same year, so down to last chance saloon
        if (a.number != b.number) {
            return a.number - b.number;
        } else {
            if (a.number_extra > b.number_extra) {
                return 1;
            }
            if (b.number_extra > a.number_extra) {
                return -1;
            }
        }
        return 0;
    }

    let params = useParams();
    const user = getCurrenUser();

    const [magazine, setMagazine]: [IMagazine | null, (magazine: IMagazine) => void] = React.useState<IMagazine | null>(null);
    const [issues, setIssue]: [string[], (issue: string[]) => void] = React.useState<string[]>([]);
    const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    const [error, setError]: [string, (error: string) => void] = React.useState("");

    React.useEffect(() => {
        async function getMagazine() {
            let url = baseURL + params.magazineId?.toString();
            try {
                const response = await getApiContent(url, user);
                setMagazine(response.data);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        getMagazine();
    }, [])

    const getIssueHeader = (index: number) =>
        (issues.length >= index) ? issues[index] : '';

    const issueNumber = (coverNumber: string, index: number) => {
        let newArray = [...issues];
        newArray[index] = coverNumber;
        setIssue(newArray);
    }

    if (!magazine) return null;

    return (

        <main>
            <h1 className="title">{magazine.name}</h1>
            {magazine !== undefined ? (
                <div>
                    {magazine.issues.length > 0 ? (
                        <div className="card">
                            {
                                magazine.issues
                                    .map((issue, index) => (
                                        <div className="card" key={issue}>
                                            <Issue
                                                id={issue}
                                                index={index}
                                            />
                                        </div>
                                    ))
                            }
                        </div>
                    ) : (
                        <p></p>
                    )}
                </div>
            ) : (
                <p>Haetaan tietoja...</p>
            )
            }
        </main >
    )
}

export default Magazine;