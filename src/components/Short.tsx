import { Link } from 'react-router-dom';
import { LinkList } from "./LinkList";
import { IPerson } from "./Person";
import { IEdition } from "./Edition";
import { IIssue } from "../Issue";

export interface IShortType {
    id: number,
    name: string
}
export interface IShort {
    id: number,
    title: string,
    orig_title: string,
    language: string,
    pubyear: number,
    authors: IPerson[],
    type: IShortType,
    editions: IEdition[],
    issues: IIssue[]
}

interface ShortProps {
    short: IShort,
    skipAuthors?: boolean,
    listPublications?: boolean,
}

export const groupShorts = (shorts: IShort[]) => {
    let grouped: Record<string, IShort[]> =
        shorts.reduce((acc: { [index: string]: any }, currentValue) => {
            const groupKey = currentValue.authors.map((author) => author.name).join(", ");
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {});
    return grouped;
}

export const ShortSummary = ({ short, skipAuthors, listPublications }: ShortProps) => {
    //const user = getCurrenUser();
    //let [short, setShort]: [IShort | null, (story: IShort) => void] = React.useState<IShort | null>(null);

    const PickLinks = (items: IPerson[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] }));
    }

    const shortEditions = (editions: IEdition[]) => {
        // Only show one item even if there are several editions,
        // e.g. remove editions of the same work.
        if (editions.length === 0) {
            return <></>
        }
        const uniqueIds: number[] = [];
        const uniqueEditions = editions
            .sort((a, b) => a.pubyear > b.pubyear ? -1 : 1)
            .filter(edition => {
                const isDuplicate = uniqueIds.includes(edition.work[0].id);
                if (!isDuplicate) {
                    uniqueIds.push(edition.work[0].id);
                    return true;
                }
                return false;
            })
        const retval = uniqueEditions.map((edition) => (
            <span className="ml-2">
                <Link to={`/works/${edition.work[0].id}`}
                    key={edition.work[0].id}>
                    {edition.work[0].title} ({edition.work[0].pubyear}).
                    <br />
                </Link>
            </span>
        ))
        return retval;
    }

    const shortIssues = (issues: IIssue[]) => {
        if (issues.length === 0) {
            return <></>
        }
        const retval = issues.map((issue) => (
            <span className="ml-2">
                <Link to={`/issues/${issue.id}`}
                    key={issue.id}>
                    {issue.magazine.name} {issue.cover_number}.
                    <br />
                </Link>
            </span>
        ))
        return retval;
    }
    // React.useEffect(() => {
    //     async function getShort() {
    //         let url = baseURL + id?.toString();
    //         try {
    //             const response = await getApiContent(url, user);
    //             setShort(response.data);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }
    //     getShort();
    // }, [id])

    //if (!short) return null;

    return (
        <div>
            {short !== null && short !== undefined ? (
                <div>
                    <div>
                        {!skipAuthors &&
                            <b>
                                <LinkList
                                    path="people"
                                    items={PickLinks(short.authors)}
                                />:<> </>
                            </b>
                        }
                        <b>{short.title}</b>
                        {short.orig_title !== short.title && (
                            <> ({short.orig_title})</>
                        )}
                        {short.pubyear && (
                            <>, {short.pubyear}</>
                        )
                        }
                        <>.</>
                    </div>
                    {listPublications &&
                        short.editions.length > 0 && (
                            <div>
                                {shortEditions(short.editions)}
                            </div>
                        )}
                    {listPublications && short.issues.length > 0 && (
                        <div>
                            {shortIssues(short.issues)}
                        </div>
                    )}
                </div>
            ) : (
                <p>Haetaan tietoja..</p>
            )
            }
        </div >
    )
}