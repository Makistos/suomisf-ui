import React, { useState, useRef } from 'react';
import { Link } from "react-router-dom";

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { ConfirmDialog, confirmDialog, ConfirmDialogProps } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { LinkList } from "../../../components/link-list";
import { EditionProps } from "../types";
import { EditionVersion } from "../utils/edition-version";
import { EditionForm } from './edition-form';
import { deleteApiContent } from '../../../services/user-service';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Contribution } from '../../../types/contribution';

const contributorList = (contributions: Contribution[], role: number, description: String, showDescription: boolean) => {
    const contributors = contributions.filter(person => person.role.id === role);

    return (
        <>
            {contributors && contributors.length > 0 &&
                (
                    <><br /><>{description} </>
                        <LinkList path="people" showDescription={showDescription}
                            separator=" &amp; "
                            items={contributors.map((item) => ({
                                id: item.person['id'],
                                name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name'],
                                description: (item.description === null || item.description === "") ? item.role.name.toLocaleLowerCase() : item.description?.toLocaleLowerCase()
                            }))} />.
                    </>
                )
            }
        </>
    )
}

export const EditionDetails = ({ edition, work, card }: EditionProps) => {
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false)
    }

    const queryClient = useQueryClient();
    const onDialogHide = () => {
        setLoading(true);
        queryClient.invalidateQueries({ queryKey: ["work", work?.id] });
        //setQueryEnabled(true);
        setLoading(false);
        setEditVisible(false);
    }

    const deleteEdition = async (id: number) => {
        setLoading(true);
        //setQueryEnabled(false);
        if (id != null) {
            await deleteApiContent("editions/" + id);
        }
        queryClient.invalidateQueries();
        //setQueryEnabled(true);
        setLoading(false);
        toast.current?.show({ severity: 'success', summary: 'Painos poistettu' });
    }

    const confirmDelete = (event: any) => {
        confirmPopup({
            target: event.currentTarget,
            message: "Haluatko varmasti poistaa painoksen?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                deleteEdition(edition.id);
            },
            reject: () => {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Painosta ei poistettu'
                });
            }
        })
    }

    return (
        <div>
            <Dialog maximizable blockScroll className="w-full xl:w-6"
                header="Painoksen muokkaus" visible={isEditVisible}
                onShow={() => onDialogShow()}
                onHide={() => onDialogHide()}
            >
                <EditionForm edition={edition} work={work} onSubmitCallback={onDialogHide} />
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
                    {contributorList(edition.contributions, 2, "Suom.", false)}
                    {/* {edition.contributions && edition.contributions.length > 0 &&
                        edition.contributions.filter(person => person.role.id === 2).length > 0 &&
                        (
                            <><br /><>Suom. </>
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={edition.contributions.filter(
                                        contrib => contrib.role.id === 2).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                        }))} />.
                            </>
                        )} */}
                    {edition.pubseries && (<>
                        <br /><Link to={`/pubseries/${edition.pubseries.id}`}>{edition.pubseries.name}</Link>
                        {edition.pubseriesnum && (<> {edition.pubseriesnum}</>)}
                        .</>
                    )}
                    {edition.pages && (<><br />{edition.pages} sivua. </>)}
                    {edition.size && edition.size + " cm."}
                    {edition.misc && (<><br />{edition.misc}</>)}
                    {(edition.isbn || edition.binding.id > 1) && <br />}
                    {edition.isbn && (<>ISBN {edition.isbn}</>)}
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
                    {contributorList(edition.contributions, 4, "Ulkoasu", true)}
                    {edition.verified &&
                        <>
                            <br /><b>Tarkastettu.</b>
                        </>
                    }
                    <br />
                    <div>
                        <Button icon="pi pi-pencil" tooltip="Muokkaa" className="p-button-text" onClick={() => onDialogShow()} />
                        <Button icon="pi pi-trash" tooltip="Poista" className="p-button-text"
                            onClick={confirmDelete} />
                        {work && work.stories && work.stories.length > 0 && (
                            <Button icon="fa fa-list-ul" tooltip="Novellit" className='p-button-text' />
                        )}
                    </div>
                </>
            }
        </div >
    );

};
