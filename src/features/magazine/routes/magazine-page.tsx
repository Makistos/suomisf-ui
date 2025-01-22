import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrenUser } from "../../../services/auth-service";
import { deleteApiContent, getApiContent, HttpStatusResponse } from "../../../services/user-service";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IssuePage } from '../../issue';
import { Magazine } from '../types';
import { useDocumentTitle } from '../../../components/document-title';
import { Toast } from 'primereact/toast';
import { IssueForm } from '@features/issue/components/issue-form';
import { Dialog } from 'primereact/dialog';
import { isAdmin } from '@features/user';
import { Tooltip } from 'primereact/tooltip';
import { SpeedDial } from 'primereact/speeddial';
import { set } from 'lodash';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMagazine } from '@api/magazine/get-magazine';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MagazineForm } from '../components/magazine-form';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';


const baseURL = "magazines/";

export const MagazinePage = () => {

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
    const magazineId = params.magazineId;
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [isMagazineFormVisible, setMagazineFormVisible] = React.useState(false);
    const [isIssueFormVisible, setIssueFormVisible] = React.useState(false);
    const toastRef = useRef<Toast>(null);
    const queryClient = useQueryClient();
    const [targetId, setTargetId] = useState(magazineId !== undefined ? magazineId : null);
    const navigate = useNavigate();

    const { isLoading, data } = useQuery({
        queryKey: ['magazine', magazineId],
        queryFn: () => getMagazine(magazineId !== undefined ? magazineId : null, user),
        enabled: queryEnabled
    })

    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.name);
    }, [data])

    const deleteMagazine = (id: number) => {
        setQueryEnabled(false);
        const retval = deleteApiContent('magazines/' + id);
        setQueryEnabled(true);
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: number) => deleteMagazine(values),
        onSuccess: (data: HttpStatusResponse) => {
            queryClient.invalidateQueries({ queryKey: ['magazine', magazineId] });
            if (data.status === 200) {
                navigate(-1);
                toastRef.current?.show({ severity: 'success', summary: 'Lehti poistettu' })
            } else {
                toastRef.current?.show({ severity: 'error', summary: 'Lehden poisto ei onnistunut' })
            }
        },
        onError: () => {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Lehden poisto ei onnistunut'
            });
        }
    })

    const dialItems = [
        {
            label: 'Uusi lehti',
            icon: 'fa-solid fa-circle-plus',
            command: () => { setTargetId(null); setMagazineFormVisible(true) }
        },
        {
            label: 'Uusi numero',
            icon: 'fa-solid fa-file-circle-plus',
            command: () => { setIssueFormVisible(true) }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => { setTargetId(data && data.id ? data.id.toString() : null); setMagazineFormVisible(true) }
        },
        {
            label: 'Poista',
            icon: 'fa-solid fa-trash',
            command: () => {
                confirmDialog({
                    message: 'Haluatko varmasti poistaa lehden?',
                    header: 'Varmistus',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: () => {
                        if (data) {
                            mutate(data.id);
                        }
                    },
                    reject: () => {
                        toastRef.current?.show({
                            severity: 'info',
                            summary: 'Lehteä ei poistettu'
                        });
                    }
                })
            }
        }
    ]

    const onMagazineFormHide = () => {
        setMagazineFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['magazine', magazineId] });
    }
    const onMagazineFormShow = () => {

    }
    const onIssueFormHide = () => {
        setIssueFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['magazine', magazineId] });
    }

    if (!data) return null;

    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action">

                        </Tooltip>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction='left'
                            type="semi-circle"
                            radius={80}
                        />
                    </div>
                }
                <ConfirmDialog />
                <Toast ref={toastRef} />
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Muokkaa"
                    visible={isMagazineFormVisible}
                    onHide={() => onMagazineFormHide()}
                    onShow={() => onMagazineFormShow()}>
                    <MagazineForm
                        id={targetId}
                        onSubmitCallback={onMagazineFormHide}
                    />
                </Dialog>
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Uusi numero"
                    visible={isIssueFormVisible}
                    onHide={() => setIssueFormVisible(false)}
                    onShow={() => setIssueFormVisible(true)}>
                    <IssueForm
                        issueid={null}
                        magazineid={data.id}
                        onSubmitCallback={onIssueFormHide}
                    />
                </Dialog>

                {data.publisher && (
                    <div className="grid col-12 justify-content-center mb-0">
                        <h2 className='mb-0'>{data.publisher.name}</h2>
                    </div>
                )}
                <div className="grid col-12 justify-content-center">
                    <h1 className="mt-1 mb-0">{data.name}</h1>
                </div>
                <div className="grid col-12 justify-content-center">
                    <h2 className="mt-1 mb-0">
                        <Link to={data.link}>{data.link}</Link></h2>
                </div>
                <p>{data.type.name}
                    {data.issn && (
                        <>, ISSN {data.issn}.</>)
                    }
                </p>
                {data.description &&
                    <div dangerouslySetInnerHTML={{ __html: data.description }}></div>
                }
                <p>{data.issues?.length} numeroa.</p>
                {isLoading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (
                        <div>
                            {data.issues?.length > 0 &&
                                <div className="card">
                                    {
                                        data.issues
                                            .map((issue, index) => (
                                                <div className="card" key={issue}>
                                                    <IssuePage
                                                        id={issue}
                                                        magazine_id={data.id}
                                                        index={index}
                                                        onSubmitCallback={onIssueFormHide}
                                                        toast={toastRef}
                                                    />
                                                </div>
                                            ))
                                    }
                                </div>
                            }
                        </div>
                    )}
            </div>
        </main >
    )
}
