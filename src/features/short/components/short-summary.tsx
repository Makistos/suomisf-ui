import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

import { LinkList } from "../../../components/link-list";
import { Person } from "../../person";
import { Edition } from "../../edition";
import { Issue } from "../../issue";
import { GenreList } from "../../genre";
import { ShortsForm } from './shorts-form';
import { Contribution } from '../../../types/contribution';
import { Short } from '../types';

interface ShortProps {
    /**
     * Short object.
     */
    short: Short,
    /**
     * Whether to show authors.
     */
    skipAuthors?: boolean,
    /**
     * Whether to list publications where short was published (books and
     * magazines).
     */
    listPublications?: boolean,
    enableQueries?: (state: boolean) => void
}

export const ShortSummary = ({ short, skipAuthors, listPublications,
    enableQueries }: ShortProps) => {
    //const user = getCurrenUser();
    //let [short, setShort]: [IShort | null, (story: IShort) => void] = React.useState<IShort | null>(null);
    const [isEditVisible, setEditVisible] = useState(false);


    const PickLinks = (items: Contribution[]) => {
        const retval = items.map((item) => item.person);
        return retval;
    }

    const shortEditions = (editions: Edition[]) => {
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

    const shortIssues = (issues: Issue[]) => {
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

    const translators = (contributors: Contribution[]) => {
        if (!contributors) return (<></>)
        const translators = contributors.filter(contributor => contributor.role.name === 'Kääntäjä');
        if (translators.length === 0) return (<></>)
        return (
            <>
                Suom {translators.map(tr => tr.person.alt_name).join(', ')}
                . </>
        )
    }

    const orderContributions = (short: Short): Short => {
        let retval: Short = short
        if (short.contributors !== undefined) {
            let contrib = short.contributors.sort((a, b) => a.role.id - b.role.id)
            retval.contributors = contrib
        }
        return retval
    }

    const onDialogShow = () => {
        if (enableQueries) {
            enableQueries(false);
        }
    }

    const onDialogHide = () => {
        if (enableQueries) {
            enableQueries(true)
        }
        setEditVisible(false);
    }
    // if (short !== undefined) {
    //     console.log(short)
    // }

    return (
        <div>
            <Dialog maximizable blockScroll
                header="Novellin muokkaus" visible={isEditVisible}
                onShow={() => onDialogShow()}
                onHide={() => onDialogHide()} >
                <ShortsForm short={orderContributions(short)} onSubmitCallback={setEditVisible} />
            </Dialog>
            {short ? (
                <div key={short.id}>
                    <div>
                        {!skipAuthors &&
                            <b>
                                <LinkList
                                    path="people"
                                    items={PickLinks(short.contributors.filter(contributor => contributor.role.name === 'Kirjoittaja'))}
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
                        <>{translators(short.contributors)}</>
                        {/*{translators(short.contributors)} */}
                        {short.genres.length > 0 &&
                            <GenreList genres={short.genres} />
                        }
                        <Button
                            icon="fa-solid fa-pen-to-square"
                            className="p-button-rounded p-button-info p-button-text"
                            onClick={() => setEditVisible(true)}
                        />

                    </div>
                    {listPublications && short && short.editions &&
                        short.editions.length > 0 && (
                            <div>
                                {shortEditions(short.editions)}
                            </div>
                        )}
                    {listPublications && short.issues && short.issues.length > 0 && (
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