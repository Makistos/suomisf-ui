import { Link } from 'react-router-dom';
import { LinkList } from "../../components/LinkList";
import type { IPerson } from "../Person/Person";
import type { IEdition } from "../../components/Edition";
import type { IIssue } from "../Issue/Issue";
import type { IGenre } from '../../components/Genre';
import { GenreList } from '../../components/Genre';
import { Dialog } from 'primereact/dialog';
import { ShortsForm } from '../../components/forms/ShortsForm';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { IContribution } from '../../components/Contribution';
import { ITag } from '../../components/Tag/SFTag';

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
    issues: IIssue[],
    genres: IGenre[],
    contributors: IContribution[],
    tags: ITag[]
}

interface ShortProps {
    /**
     * Short object.
     */
    short: IShort,
    /**
     * Whether to show authors.
     */
    skipAuthors?: boolean,
    /**
     * Whether to list publications where short was published (books and
     * magazines).
     */
    listPublications?: boolean,
}

export const shortIsSf = (short: IShort) => {
    /**
     * Checks whether short is the sf genre.
     *
     * A short is not SF is it has exactly one genre and that genre's
     * abbreviation is "eiSF". Any other combination means it's SF.
     */
    if (short.genres.length === 1 && short.genres[0].abbr === 'eiSF')
        return false;
    return true;
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
    const [isEditVisible, setEditVisible] = useState(false);

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
            <span className="ml-2" key={edition.id}>
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
            <span className="ml-2" key={issue.id}>
                <Link to={`/issues/${issue.id}`}
                    key={issue.id}>
                    {issue.magazine.name} {issue.cover_number}.
                    <br />
                </Link>
            </span>
        ))
        return retval;
    }

    const translators = (contributors: IContribution[]) => {
        if (!contributors) return (<></>)
        const translators = contributors.filter(contributor => contributor.role.name === 'Kääntäjä');
        if (translators.length === 0) return (<></>)
        return (
            <>
                Suom. {translators.map(tr => tr.person.name).join(', ')}
                .</>
        )
    }

    return (
        <div>
            <Dialog maximizable blockScroll
                header="Novellin muokkaus" visible={isEditVisible} onHide={() => setEditVisible(false)} >
                <ShortsForm short={short} />
            </Dialog>
            {short !== null && short !== undefined ? (
                <div key={short.id}>
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
                        <>. </>
                        {translators(short.contributors)}
                        {short.genres.length > 0 &&
                            <GenreList genres={short.genres} />
                        }
                        <Button
                            icon="fa-solid fa-pen-to-square"
                            className="p-button-rounded p-button-info p-button-text"
                            onClick={() => setEditVisible(true)}
                        />

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