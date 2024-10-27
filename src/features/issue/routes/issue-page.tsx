import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from "react-router-dom";

import { getCurrenUser } from '../../../services/auth-service';
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
import { IssueForm } from '../components/issue-form';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { deleteIssue } from '@api/issue/delete-issue';
import { ImageView } from '@utils/image-view';
import { ImageType } from "../../../types/image";
import { deleteIssueCover } from '@api/issue/delete-issue-cover';
import { saveIssueCover } from '@api/issue/save-issue-cover';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { on } from 'events';

const baseURL = 'issues/';

export type IssueProps = {
    id: number | null,
    magazine_id: number
    index?: number,
    onSubmitCallback: ((status: boolean, message: string) => void),
    toast?: RefObject<Toast>
};

const PickLinks = (items: Person[]) => {
    return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
}

type IssueInfoProps = {
    issue: Issue
}

const IssueInfo = ({ issue }: IssueInfoProps) => {
    return (
        <div className="p-col-12 p-md-8">
            <h2>{issue.magazine.name} {issue.cover_number}
            </h2>
            {issue.title &&
                <h3>{issue.title}</h3>
            }
            <div>
                {issue.editors && issue.editors.length && (
                    <LinkList
                        path="people"
                        separator=" &amp; "
                        items={PickLinks(issue.editors)}
                    />)}
                {issue.editors.length && " (päätoimittaja)"}

            </div>
            {issue.pages && issue.pages > 0 ? issue.pages + " sivua." : ""}
            {issue.size ? " " + issue.size.name + "." : ""}
            {issue.link && issue.link !== "" && (
                <>
                    <br /><Link to={issue.link} target="_blank">Kotisivu</Link>.
                </>
            )}
            {issue.notes && issue.notes !== "" && (
                <div dangerouslySetInnerHTML={{ __html: issue.notes }} />
            )}
            {issue.articles.length > 0 && (
                <div className="p-pt-2"><b>Artikkelit</b>
                    <div className="p-ml-3">
                        <ArticleList articles={issue.articles} />
                    </div>
                </div>
            )
            }
            {issue.stories.length > 0 && (
                <div className="p-pt-2"><b>Novellit</b>
                    <div className="p-ml-3">
                        {
                            issue.stories
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

    )
}

export const IssuePage = ({ id, magazine_id, index, onSubmitCallback, toast }: IssueProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [issueFormVisible, setIssueFormVisible] = useState(false);
    //const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();
    // if (toast === undefined) {
    //     toast = useRef<Toast>(null);
    // }
    const { isLoading, data } = useQuery({
        queryKey: ['issue', id],
        queryFn: () => getIssue(id !== undefined ? id : null, user),
        enabled: queryEnabled
    })


    const delIssue = async (id: number | null) => {
        await deleteIssue(id).then(response => {
            if (response?.status === 200) {
                onUpload('success', 'Numero poistettu onnistuneesti');
                // toast.current?.show({
                //     severity: 'info',
                //     summary: 'Numero poistettu onnistuneesti'
                // });
                // onSubmitCallback(true, 'Numero poistettu onnistuneesti');
            } else {
                onUpload('error', 'Numeroa ei poistettu');
                // toast.current?.show({
                //     severity: 'error',
                //     summary: 'Numeroa ei poistettu',
                //     detail: response?.response,
                //     sticky: true
                // });
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
                onUpload('error', 'Numeroa ei poistettu');
                // toast.current?.show({
                //     severity: 'info',
                //     summary: 'Numeroa ei poistettu'
                // });
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

    // imageId is not needed here but required in saveImage so it is just
    // set to 0
    const strToImageType = (str: string) => {
        if (str) {
            return [{
                id: 0,
                image_src: str,
                image_attr: "",
                size: null
            }] as ImageType[];
        }
        return [];
    }

    const saveImage = useCallback(async (event: FileUploadHandlerEvent) => {
        if (data) {
            saveIssueCover(data.id, event.files[0], event.files[0].name, user).then(response => {
                if (response?.status === 200) {
                    onUpload('success', 'Kansi lisätty onnistuneesti');
                } else {
                    onUpload('error', 'Virhe kantta lisätäessä');
                }
            });
        }
    }, [data, user]);

    const deleteImage = (objectId: number, imageId: number) => {
        if (data) {
            const response = deleteIssueCover(data.id).then(response => {
                if (response?.status === 200) {
                    onUpload('success', 'Kansi poistettu onnistuneesti');
                } else {
                    onUpload('error', 'Virhe kantta poistettaessa');
                }
            });
        }
    }

    const onUpload = useCallback((severity: "success" | "info" | "warn" | "error", message: string) => {
        toast?.current?.show({
            severity: severity,
            summary: '',
            detail: message
        })
        queryClient.invalidateQueries({ queryKey: ['issue', id] });
    }, [id])

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
                        <IssueInfo issue={data} />
                        <div className="p-col-12 p-md-4">
                            {(data.image_src && id) ? (
                                <ImageView
                                    itemId={id}
                                    images={strToImageType(data.image_src)}
                                    idx={0}
                                    deleteFunc={deleteImage}
                                    idxCb={
                                        (idx: number) => {

                                        }
                                    }
                                />
                                // <>
                                //     <Image src={data.image_src} width="250px" preview
                                //         alt={`${data.cover_number} kansikuva`}
                                //     />
                                // </>
                            ) : isAdmin(user) &&
                            <FileUpload
                                id={"issue-image-" + id}
                                mode="basic"
                                accept='image/*'
                                name="image"
                                uploadLabel='Lisää kuva'
                                auto
                                customUpload
                                uploadHandler={saveImage}
                            //onUpload={onUpload}
                            />
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
