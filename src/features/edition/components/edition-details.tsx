import React, { useState } from 'react';
import { Link } from "react-router-dom";

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { LinkList } from "../../../components/link-list";
import { EditionProps } from "../types";
import { EditionVersion } from "../utils/edition-version";
import { EditionForm } from './edition-form';

export const EditionDetails = ({ edition, work, card }: EditionProps) => {
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false)
    }

    const queryClient = useQueryClient();
    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", work?.id] });
        setQueryEnabled(true);
        setEditVisible(false);
    }


    return (
        <div>
            <Dialog maximizable blockScroll
                header="Teoksen muokkaus" visible={isEditVisible}
                onShow={() => onDialogShow()}
                onHide={() => onDialogHide()}
            >
                <EditionForm edition={edition} onSubmitCallback={onDialogHide} />
            </Dialog>

            {card && <b><EditionVersion edition={edition} /></b>}
            {work !== undefined && edition.title !== work.title &&
                <><br /><i className="font-medium">{edition.title}</i></>}
            {edition.publisher && (
                <><br /><Link to={`/publishers/${edition.publisher.id}`}>{edition.publisher.name}</Link> </>)}
            {edition.pubyear + "."}
            {edition.translators.length > 0 && (
                <><br /><>Suom. </>
                    <LinkList path="people"
                        separator=" &amp; "
                        items={edition.translators.map((item) => ({
                            id: item['id'],
                            name: item['alt_name'] ? item['alt_name'] : item['name']
                        }))} />.
                </>
            )}
            {edition.pages && (<><br />{edition.pages} sivua. </>)}
            {edition.size && edition.size + " cm."}
            {edition.misc && (<><br />{edition.misc}</>)}
            {(edition.isbn || edition.binding.id > 1) && <br />}
            {edition.isbn && (<>ISBN {edition.isbn}</>)}
            {edition.binding.id > 1 && (<> {edition.binding.name}.</>)}
            {edition.dustcover === 3 && (
                <span><br />Kansipaperi.</span>
            )}
            {edition.coverimage === 3 &&
                <span><br />Ylivetokannet.</span>}<br />
            <div>
                <Button icon="pi pi-pencil" tooltip="Muokkaa" className="p-button-text" onClick={() => onDialogShow()} />
                <Button icon="pi pi-trash" tooltip="Poista" className="p-button-text" />
                {work && work.stories && work.stories.length > 0 && (
                    <Button icon="fa fa-list-ul" tooltip="Novellit" className='p-button-text' />
                )}
            </div>
        </div>
    );

};
