import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from "react-router-dom";

import { Image } from 'primereact/image';

import { getCurrenUser } from '../../../services/auth-service';
import { getApiContent } from '../../../services/user-service';
import { Person } from "../../person/types";
import { LinkList } from '../../../components/link-list';
import { ShortSummary } from '../../short';
import { ArticleList } from '../../article';
import { Issue } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getIssue } from '@api/issue/get-issue';
import { ProgressSpinner } from 'primereact/progressspinner';
import { isAdmin } from '@features/user';
import { Button } from 'primereact/button';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { SpeedDial } from 'primereact/speeddial';
import { IssueForm } from '../components/issue-form';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { deleteIssue } from '@api/issue/delete-issue';

const baseURL = 'issues/';

export type IssueProps = {
    id: number | null,
    magazine_id: number
    index?: number,
    onSubmitCallback: ((status: boolean, message: string) => void),
    toast?: RefObject<Toast>
};

export const IssuePage = ({ id, magazine_id, index, onSubmitCallback, toast }: IssueProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [issueFormVisible, setIssueFormVisible] = useState(false);
    //const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();
    if (toast === undefined) {
        toast = useRef<Toast>(null);
    }
    const { isLoading, data } = useQuery({
        queryKey: ['magazine', id],
        queryFn: () => getIssue(id !== undefined ? id : null, user),
        enabled: queryEnabled
    })

    const PickLinks = (items: Person[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
    }

    const delIssue = async (id: number | null) => {
        await deleteIssue(id).then(response => {
            if (response?.status === 200) {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Numero poistettu onnistuneesti'
                });
                onSubmitCallback(true, 'Numero poistettu onnistuneesti');
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Numeroa ei poistettu',
                    detail: response?.response,
                    sticky: true
                });
            }
        });
    }

    const confirmDelete = (event: any) => {
        confirmPopup({
            target: event.currentTarget,
            message: "Haluatko varmasti poistaa painoksen?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                delIssue(id);
            },
            reject: () => {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Numeroa ei poistettu'
                });
            }
        })
    }

    const onFormSubmit = (success: boolean, message: string) => {
        if (!success) {
            console.log(message);
        }
        onDialogHide();
        setQueryEnabled(true);
        onSubmitCallback(success, message);
    }

    const onDialogShow = () => {
        setIssueFormVisible(true);
        setQueryEnabled(false);
    }

    const onDialogHide = () => {
        setIssueFormVisible(false);
        setQueryEnabled(true);
    }

    if (!data) return null;

    return (
        <div className="p-m-3">
            {isLoading ?
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
                :
                <>
                    <Toast ref={toast} />
                    <ConfirmPopup />
                    <Dialog maximizable blockScroll
                        className="w-full xl:w-6"
                        visible={issueFormVisible}
                        onShow={onDialogShow}
                        onHide={onDialogHide}
                        header="Muokkaa numeroa">
                        <IssueForm
                            issueid={id}
                            magazineid={magazine_id}
                            onSubmitCallback={onFormSubmit}
                        />
                    </Dialog>
                    <div className="p-grid">
                        <div className="p-col-12 p-md-8">
                            <h2>{data.magazine.name} {data.cover_number}
                                {data.year && " / " + data.year}
                            </h2>
                            {data.title &&
                                <h3>{data.title}</h3>
                            }
                            <div>
                                {data.editors && data.editors.length && (
                                    <LinkList
                                        path="people"
                                        separator=" &amp; "
                                        items={PickLinks(data.editors)}
                                    />)}
                                {data.editors.length && " (päätoimittaja)"}

                            </div>
                            {data.pages && data.pages > 0 ? data.pages + " sivua." : ""}
                            {data.size ? " " + data.size.name + "." : ""}
                            {data.link && data.link !== "" && (
                                <>
                                    <br /><Link to={data.link} target="_blank">Kotisivu</Link>.
                                </>
                            )}
                            {data.notes && data.notes !== "" && (
                                <div dangerouslySetInnerHTML={{ __html: data.notes }} />
                            )}
                            {data.articles.length > 0 && (
                                <div className="p-pt-2"><b>Artikkelit</b>
                                    <div className="p-ml-3">
                                        <ArticleList articles={data.articles} />
                                    </div>
                                </div>
                            )
                            }
                            {data.stories.length > 0 && (
                                <div className="p-pt-2"><b>Novellit</b>
                                    <div className="p-ml-3">
                                        {
                                            data.stories
                                                .map((story) => (
                                                    <ShortSummary key={story.id}
                                                        short={story}
                                                    />
                                                ))
                                        }
                                    </div>
                                </div>
                            )
                            }
                        </div>
                        <div className="p-col-12 p-md-4">
                            {data.image_src ? (
                                <>
                                    <Image src={data.image_src} width="250px" preview
                                        alt={`${data.cover_number} kansikuva`}
                                    />
                                </>
                            ) : ("")
                            }
                        </div>
                        <div>
                            {isAdmin(user) &&
                                <>
                                    <Button icon="pi pi-pencil" tooltip="Muokkaa" className="p-button-text" onClick={() => onDialogShow()} />
                                    <Button icon="pi pi-trash" tooltip="Poista" className="p-button-text"
                                        onClick={confirmDelete}
                                    />
                                </>
                            }
                        </div>
                    </div>
                </>
            }
        </div >
    )
}
