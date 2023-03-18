import React, { useEffect } from 'react';
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { useParams } from "react-router-dom";
import { IssuePage } from '../../issue';
import { Magazine } from '../types';
import { useDocumentTitle } from '../../../components/document-title';


const baseURL = "magazines/";

const MagazinePage = () => {

    /*var issueSort = function (a: IIssue, b: IIssue): number {
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
    }*/

    let params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");

    const [magazine, setMagazine]: [Magazine | null, (magazine: Magazine) => void] = React.useState<Magazine | null>(null);
    //const [issues, setIssue]: [string[], (issue: string[]) => void] = React.useState<string[]>([]);
    //const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    //const [error, setError]: [string, (error: string) => void] = React.useState("");

    React.useEffect(() => {
        async function getMagazine() {
            let url = baseURL + params.magazineId?.toString();
            try {
                const response = await getApiContent(url, user);
                setMagazine(response.data);
                //setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        getMagazine();
    }, [params.magazineId, user]) // eslint disable

    /*const getIssueHeader = (index: number) =>
        (issues.length >= index) ? issues[index] : '';

    const issueNumber = (coverNumber: string, index: number) => {
        let newArray = [...issues];
        newArray[index] = coverNumber;
        setIssue(newArray);
    }
    */
    useEffect(() => {
        if (magazine !== undefined && magazine !== null)
            setDocumentTitle(magazine.name);
    }, [magazine])

    if (!magazine) return null;

    return (

        <main className="all-content">
            <h1 className="title">{magazine.name}</h1>
            {magazine !== undefined ? (
                <div>
                    {magazine.issues.length > 0 ? (
                        <div className="card">
                            {
                                magazine.issues
                                    .map((issue, index) => (
                                        <div className="card" key={issue}>
                                            <IssuePage
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

export default MagazinePage;