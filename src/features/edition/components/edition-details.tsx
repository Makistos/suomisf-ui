import React, { useState, useRef, useMemo } from 'react';
import { Link } from "react-router-dom";

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { LinkList } from "../../../components/link-list";
import { EditionProps } from "../types";
import { EditionVersion } from "../utils/edition-version";
import { EditionForm } from './edition-form';
import { deleteApiContent } from '../../../services/user-service';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Contribution } from '../../../types/contribution';
import { EditionShortsPicker } from '../../short/components/shorts-picker';
import { isDisabled } from '../../../components/forms/forms';
import { getCurrenUser } from '../../../services/auth-service';
import { isAdmin } from '../../user';

type Props = EditionProps & { onSubmitCallback: ((status: boolean, message: string) => void) };

/**
 * Generates a list of contributors based on their contributions and role.
 *
 * @param contributions - An array of contributions.
 * @param role - The role ID of the contributors to filter.
 * @param description - The description to display before the contributor list.
 * @param showDescription - Flag to indicate whether to show the description or not.
 * @return The generated list of contributors.
 */
const contributorList = (contributions: Contribution[], role: number, description: string, showDescription: boolean) => {
    const contributors = contributions.filter(person => person.role.id === role);

    return (
        <>
            {contributors && contributors.length > 0 &&
                (
                    <><br />
                        <LinkList path="people" showDescription={showDescription}
                            separator=", "
                            defaultName={description}
                            items={contributors.map((item) => ({
                                id: item.person['id'],
                                name: item.person['alt_name']
                                    ? item.person['alt_name'] : item.person['name'],
                                description: (item.description && item.description !== null)
                                    ? item.description : ""
                            }))} />.
                    </>
                )
            }
        </>
    )
}

export const EditionDetails = ({ edition, work, card, onSubmitCallback }: Props) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [editVisible, setEditVisible] = useState(false);
    const [shortsFormVisible, setShortsFormVisible] = useState(false);

    const [queryEnabled, setQueryEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false)
    }

    const queryClient = useQueryClient();
    const onDialogHide = () => {
        setEditVisible(false);
    }

    const onFormSubmit = (status: boolean, message: string) => {
        onSubmitCallback(status, message);
        onDialogHide();
    }

    const onShortsShow = () => {
        setShortsFormVisible(true);
        setQueryEnabled(false)
    }

    const onShortsHide = () => {
        setShortsFormVisible(false);
        setQueryEnabled(true)
    }

    const deleteEdition = async (id: number) => {
        setLoading(true);
        if (id !== null) {
            await deleteApiContent("editions/" + id).then(
                result => {
                    if (result.status === 200) {
                        toast.current?.show(
                            {
                                severity: 'success',
                                summary: 'Painos poistettu'
                            });
                        setLoading(false);
                    } else {
                        toast.current?.show(
                            {
                                severity: 'error',
                                summary: 'Painosta ei poistettu',
                                detail: result.response,
                                sticky: true
                            });
                        setLoading(false);
                    }
                });
        }
    }

    const confirmDelete = (event: any) => {
        confirmPopup({
            target: event.currentTarget,
            message: "Haluatko varmasti poistaa painoksen?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                deleteEdition(edition.id);
                queryClient.invalidateQueries();
                setLoading(false);
            },
            reject: () => {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Painosta ei poistettu'
                });
            }
        })
    }

    /**
     * A function that takes an ISBN and returns a link to National Library
     * search pointing to this ISBN.
     *
     * @param {string} isbn - the ISBN input
     * @return {string} the link
     */
    const nlLinkFromIsbn = (isbn: string): string => {
        return ("https://kansalliskirjasto.finna.fi/Search/Results?"
            + "limit=0&"
            + "filter%5B%5D=~language%3A%22fin%22&"
            + "filter%5B%5D=~format_ext_str_mv%3A%220%2FBook%2F%22&"
            + "&filter%5B%5D=~collection%3A%22FEN%22&"
            + "lookfor=" + encodeURIComponent(isbn))
            + "&type=AllFields"
    }

    return (
        <div>
            <Dialog maximizable blockScroll className="w-full xl:w-6"
                header="Painoksen muokkaus"
                visible={editVisible}
                onShow={() => onDialogShow()}
                onHide={() => onDialogHide()}
            >
                <EditionForm edition={edition} work={work} onSubmitCallback={onFormSubmit} />
            </Dialog>
            <Dialog maximizable blockScroll className='w-full xl:w-9'
                header="Novellien muokkaus"
                visible={shortsFormVisible}
                onShow={() => onShortsShow()}
                onHide={() => onShortsHide()}
            >
                <EditionShortsPicker id={edition.id.toString()} onClose={() => setShortsFormVisible(false)} />
            </Dialog>
            {loading ?
                <div className="progressbar"><ProgressSpinner /></div>
                :
                <>
                    <Toast ref={toast} />
                    <ConfirmPopup />
                    {card && <b><EditionVersion edition={edition} work={work} /></b>}
                    {work !== undefined && edition.title !== work.title &&
                        <><br /><i className="font-medium">{edition.title}</i></>}
                    {edition.publisher && (
                        <><br /><Link to={`/publishers/${edition.publisher.id}`}>{edition.publisher.name}</Link> </>)}
                    {edition.pubyear + "."}
                    {contributorList(edition.contributions, 2, "Suom.", true)}
                    {edition.pubseries && (<>
                        <br /><Link to={`/pubseries/${edition.pubseries.id}`}>{edition.pubseries.name}</Link>
                        {edition.pubseriesnum && (<> {edition.pubseriesnum}</>)}
                        .</>
                    )}
                    {edition.pages && (<><br />{edition.pages} sivua. </>)}
                    {edition.size && edition.size + " cm."}
                    {edition.misc && (<><br />{edition.misc}</>)}
                    {(edition.isbn || edition.binding.id > 1) && <br />}
                    {edition.isbn && (<>ISBN <Link title='ISBN-haku Kansalliskirjastoon' to={nlLinkFromIsbn(edition.isbn)} target="_blank">{edition.isbn}</Link></>)}
                    {edition.binding && edition.binding.id > 1 && (<> {edition.binding.name}.</>)}
                    {
                        edition.dustcover === 3 && (
                            <span><br />Kansipaperi.</span>
                        )
                    }
                    {
                        edition.coverimage === 3 &&
                        <span><br />Ylivetokannet.</span>
                    }
                    {contributorList(edition.contributions, 5, "Kuvitus", true)}
                    {contributorList(edition.contributions, 4, "Kansikuva", true)}
                    {edition.verified &&
                        <>
                            <br /><b>Tarkastettu.</b>
                        </>
                    }
                    <br />
                    <div>
                        {isAdmin(user) &&
                            <>
                                <Button icon="pi pi-pencil" tooltip="Muokkaa" className="p-button-text" onClick={() => onDialogShow()} />
                                <Button icon="pi pi-trash" tooltip="Poista" className="p-button-text"
                                    onClick={confirmDelete}
                                    disabled={isDisabled(user, loading)} />
                                {work && work.stories && work.stories.length > 0 && (
                                    <Button icon="fa fa-list-ul" tooltip="Novellit"
                                        className='p-button-text'
                                        onClick={() => onShortsShow()}
                                    />
                                )}
                            </>
                        }
                    </div>
                </>
            }
        </div >
    );

};
