import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

import { LinkList } from "../../../components/link-list";
import { Edition } from "../../edition";
import { Issue } from "../../issue";
import { GenreList } from "../../genre";
import { ShortsForm } from './shorts-form';
import { Contribution } from '../../../types/contribution';
import { Short } from '../types';
import { removeDuplicateContributions } from '../../../utils';
import { isAdmin } from '../../user';
import { getCurrenUser } from '../../../services/auth-service';

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
    enableQueries?: (state: boolean) => void,
    /**
     * All editions of the containing work. When provided, stories not present
     * in every edition will be annotated with which editions they appear in.
     */
    workEditions?: Edition[],
    /**
     * Whether to hide the story type annotation. Used where the surrounding
     * context (e.g. a per-type tab) already communicates the type.
     */
    hideType?: boolean
}

export const ShortSummary = ({ short, skipAuthors, listPublications,
    enableQueries, workEditions, hideType }: ShortProps) => {
    const [isEditVisible, setEditVisible] = useState(false);
    const user = useMemo(() => { return getCurrenUser() }, []);

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
                const isDuplicate = uniqueIds.includes(edition.work?.id ? edition.work.id : 0);
                if (!isDuplicate) {
                    uniqueIds.push(edition.work?.id ? edition.work.id : 0);
                    return true;
                }
                return false;
            })
        const retval = uniqueEditions.map((edition) => (
            <span className="ml-2" key={edition.id}>
                <Link to={`/works/${edition.work?.id}`}
                    key={edition.work?.id}>
                    {edition.work?.title} ({edition.work?.pubyear}).
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
        const translators = removeDuplicateContributions(contributors.filter(
            contributor => contributor.role.name === 'Kääntäjä'));
        if (translators.length === 0) return (<></>)
        return (
            <>
                Suom {translators.map(tr => tr.person.alt_name).join(', ')}
                . </>
        )
    }

    const editionAnnotation = (): string | null => {
        if (!workEditions || workEditions.length <= 1) return null;
        const workEditionIdSet = new Set(workEditions.map(e => e.id));
        const storyWorkEditionIds = new Set(
            short.editions.filter(e => workEditionIdSet.has(e.id)).map(e => e.id)
        );
        if (storyWorkEditionIds.size >= workEditions.length) return null;
        const edLabel = (ed: Edition): string => {
            const v = Number(ed.version) || 1;
            const p = Number(ed.editionnum) || 1;
            if (v === 1) return `${p}p`;
            if (p === 1) return `${v}l`;
            return `${v}l ${p}p`;
        };
        const labels = workEditions
            .filter(e => storyWorkEditionIds.has(e.id))
            .sort((a, b) => {
                const vA = Number(a.version) || 1, vB = Number(b.version) || 1;
                if (vA !== vB) return vA - vB;
                return Number(a.editionnum) - Number(b.editionnum);
            })
            .map(edLabel);
        return `(${labels.join(', ')})`;
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


    const saveShort = (id: string, visible: boolean) => {
        setEditVisible(visible);
    }
    return (
        <div>
            <Dialog maximizable blockScroll
                header="Novellin muokkaus" visible={isEditVisible}
                onShow={() => onDialogShow()}
                onHide={() => onDialogHide()} >
                <ShortsForm short={orderContributions(short)}
                    onSubmitCallback={saveShort}
                    onClose={onDialogHide}
                    onDelete={() => { }}
                />
            </Dialog>
            {short ? (
                <div key={short.id}>
                    <div>
                        {!skipAuthors &&
                            <b>
                                <LinkList
                                    path="people"
                                    items={PickLinks(
                                        removeDuplicateContributions(
                                            short.contributors.filter(
                                                contributor => contributor.role.name === 'Kirjoittaja')))}
                                />:<> </>
                            </b>
                        }
                        <Link to={`/shorts/${short.id}`}>{short.title}</Link>
                        {short.orig_title && short.orig_title !== short.title && (
                            <> ({short.orig_title}</>
                        )}
                        {short.pubyear && (
                            <>, {short.pubyear}</>
                        )
                        }
                        {short.orig_title && short.orig_title !== short.title && (
                            <>)</>
                        )}

                        <>. </>
                        <>{translators(short.contributors)}</>
                        {/*{translators(short.contributors)} */}
                        {short.genres.length > 0 &&
                            <GenreList
                                genres={short.genres}
                            />
                        }
                        {/* {isAdmin(user) &&
                            <Button
                                icon="fa-solid fa-pen-to-square"
                                className="p-button-rounded p-button-info p-button-text"
                                onClick={() => setEditVisible(true)}
                            />
                        } */}

                        {!hideType && short.type.id !== 1 &&
                            <span>
                                <i>({short.type.name})</i>
                            </span>
                        }
                        {editionAnnotation() && (
                            <span className="ml-1 text-color-secondary">{editionAnnotation()}</span>
                        )}

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