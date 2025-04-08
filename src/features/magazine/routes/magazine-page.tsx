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
import { TabPanel, TabView } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';

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

    console.log("Magazine data", data);
    return (
        <main className="magazine-page">
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <div>
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".fixed-dial .p-speeddial-action">

                        </Tooltip>
                        <SpeedDial
                            model={dialItems}
                            direction='up'
                            className="fixed-dial"
                            showIcon="pi pi-plus"
                            hideIcon="pi pi-times"
                            buttonClassName='p-button-primary'
                        />
                    </div>
                }
                <div className="grid">
                    <div className="col-12">
                        <Card className="shadow-3">
                            <div className="grid pl-2 pr-2 pt-0">
                                {data.publisher && (
                                    <div className="grid col-12 mb-0">
                                        <h2 className='mb-0 font-semibold'>{data.publisher.name}</h2>
                                    </div>
                                )}
                                <div className="grid col-12">
                                    <h1 className="mt-1 mb-0">{data.name}</h1>
                                </div>
                                <div className="grid col-12">
                                    <h2 className="mt-1 mb-0">
                                        <Link to={data.link}>{data.link}</Link></h2>
                                </div>
                                <div className='col-12 p-0'>{data.type.name}</div>
                                <div className='col-12 p-0'>
                                    {data.issn && (
                                        <>ISSN {data.issn}.</>)
                                    }
                                </div>
                                <div className='col-12 p-0'>{data.issues?.length} numeroa.</div>
                                <div className='col-12 p-0'>
                                    {data.description &&
                                        <div dangerouslySetInnerHTML={{ __html: data.description }}></div>
                                    }
                                </div>
                            </div>
                        </Card>
                    </div>
                    {data.issues && data.issues.length > 0 && (
                        <div className="col-12">
                            <TabView className="shadow-2">
                                <TabPanel header="Lehdet" leftIcon="pi pi-book">
                                    <div className="card">
                                        {data.issues.sort((a, b) => {
                                            if (a.year !== b.year) {
                                                return a.year - b.year;
                                            }
                                            if (a.number !== b.number) {
                                                return a.number - b.number;
                                            }
                                            return 0;
                                        })
                                            .map((issue) => (
                                                <div>
                                                    <Link to={`/issues/${issue.id}`}>{issue.cover_number}</Link>
                                                    {issue.title && <span>: {issue.title}</span>}
                                                </div>
                                            ))
                                        }
                                    </div>
                                </TabPanel>
                                <TabPanel header="Kannet" leftIcon="pi pi-image">
                                    <div className="card">
                                        <div className="grid">
                                            {data.issues.sort((a, b) => {
                                                if (a.year !== b.year) {
                                                    return a.year - b.year;
                                                }
                                                if (a.number !== b.number) {
                                                    return a.number - b.number;
                                                }
                                                return 0;
                                            }
                                            )
                                                .map((issue) => (
                                                    <div className="p-1">
                                                        {issue.image_src && issue.image_src.length > 0 && (
                                                            <Image preview height="200px"
                                                                src={issue.image_src?.startsWith('http') ?
                                                                    issue.image_src :
                                                                    import.meta.env.VITE_IMAGE_URL + issue?.image_src} alt={issue.cover_number} />
                                                        )}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>
                    )}
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

                </div>
            </div>
        </main >
    )
}
