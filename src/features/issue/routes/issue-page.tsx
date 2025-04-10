import React, { Fragment, RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams } from "react-router-dom";

import { getCurrenUser } from '../../../services/auth-service';
import { Person } from "../../person/types";
import { LinkList } from '../../../components/link-list';
import { Short, ShortSummary } from '../../short';
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
import { IssueShortsPicker } from '@features/short/components/shorts-picker';
import _ from 'lodash';
import { Card } from 'primereact/card';
import { TabPanel, TabView } from 'primereact/tabview';
import { selectId } from '@utils/select-id';
import { Tooltip } from 'primereact/tooltip';
import { SpeedDial } from 'primereact/speeddial';
import { Image } from 'primereact/image';
import { ContextMenu } from 'primereact/contextmenu';
const baseURL = 'issues/';

export type IssueProps = {
    id: string | null
};

const PickLinks = (items: Person[]) => {
    return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
}

type IssueInfoProps = {
    issue: Issue
}

const getShortTypes = (shorts: Short[]) => {
    const typeList = shorts.map(short => short.type);
    const types = _.uniqBy(typeList, 'id').sort((a, b) => a.id < b.id ? -1 : 1);
    return types;

}
const IssueInfo = ({ issue }: IssueInfoProps) => {
    console.log(issue)
    return (
        <div className="col-12 lg:col-9 mb-3">
            <h1 className="mt-0 text-2xl sm:text-3xl lg:text-4xl uppercase" style={{ lineHeight: '1.1' }}>
                {issue.magazine.name} {issue.cover_number}
                <br />
                <div className="mt-0 text-base sm:txt-lg ml-1">{issue.title && issue.title}</div>
            </h1>
            {issue.editors && issue.editors.length > 0 && (
                <div className="mb-2">
                    <LinkList
                        path="people"
                        separator=" &amp; "
                        items={PickLinks(issue.editors)}
                    />
                    {issue.editors.length > 0 && " (päätoimittaja)"}
                </div>
            )}
            <div>
                {issue.pages && issue.pages > 0 ? issue.pages + " sivua." : ""}
                {issue.size ? " " + issue.size.name + "." : ""}
            </div>
            <div className="mt-2">
                {issue.notes && issue.notes !== "" && (
                    <div dangerouslySetInnerHTML={{ __html: issue.notes }} />
                )}
            </div>
        </div>
    )
}

export const IssuePage = ({ id: issue_id }: IssueProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [issueFormVisible, setIssueFormVisible] = useState(false);
    const [shortsFormVisible, setShortsFormVisible] = useState(false);
    const [articleFormVisible, setArticleFormVisible] = useState(false);
    const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();
    const params = useParams();
    let issueId = "";
    const cm = useRef<ContextMenu>(null);

    // if (toast === undefined) {
    //     toast = useRef<Toast>(null);
    // }
    try {
        issueId = selectId(params, issue_id);
    } catch (e) {
        console.log(`${e} short`);
    }
    const { isLoading, data } = useQuery({
        queryKey: ['issue', issueId],
        queryFn: () => getIssue(issueId !== undefined ? issueId : null, user),
        enabled: queryEnabled
    })


    const delIssue = async (id: string | null) => {
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
            message: "Haluatko varmasti poistaa numeron?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                delIssue(issueId);
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

    const onFormSubmit = useCallback((success: boolean, message: string) => {
        if (!success) {
            console.log(message);
        }
        onDialogHide();
        setQueryEnabled(true);
    }, [data, user]);

    const onDialogShow = () => {
        setIssueFormVisible(true);
        setQueryEnabled(false);
    }

    const onDialogHide = () => {
        setIssueFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
        setQueryEnabled(true);
    }

    // imageId is not needed here but required in saveImage so it is just
    // set to 0
    const strToImageType = (str: string) => {
        if (str) {
            return [{
                id: 0,
                image_src: str?.startsWith('http') ? str : import.meta.env.VITE_IMAGE_URL + str,
                image_attr: "",
                size: null
            }] as ImageType[];
        }
        return [];
    }

    const saveImage = useCallback(async (event: FileUploadHandlerEvent) => {
        saveIssueCover(issueId, event.files[0], event.files[0].name, user).then(response => {
            if (response?.status === 200) {
                onUpload('success', 'Kansi lisätty onnistuneesti');
            } else {
                onUpload('error', 'Virhe kantta lisätäessä');
            }
        });
    }, [issueId, user]);

    const deleteImage = useCallback(() => {
        const response = deleteIssueCover(issueId).then(response => {
            if (response?.status === 200) {
                onUpload('success', 'Kansi poistettu onnistuneesti');
            } else {
                onUpload('error', 'Virhe kantta poistettaessa');
            }
        });
    }, [issueId, user]);

    const onUpload = useCallback((severity: "success" | "info" | "warn" | "error", message: string) => {
        toast?.current?.show({
            severity: severity,
            summary: '',
            detail: message
        })
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    }, [issueId, user])

    const onShortsShow = () => {
        setShortsFormVisible(true);
    }

    const onShortsHide = () => {
        setShortsFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    }

    const onArticlesShow = () => {
        setArticleFormVisible(true);
    }

    const onArticlesHide = () => {
        setArticleFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    }

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'pi pi-pencil',
            command: () => setIssueFormVisible(true)
        },
        {
            label: 'Artikkelit ja novellit',
            icon: 'pi pi-list',
            command: () => onShortsShow()
        },
        {
            label: 'Poista numero',
            icon: 'pi pi-trash',
            command: () => confirmDelete(issueId)
        }
    ];

    const imageItems = [
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: () => {
                deleteImage();
                queryClient.invalidateQueries();
            },
            visible: isAdmin(getCurrenUser())
        },
        {
            label: 'Kopioi osoite',
            icon: 'pi pi-copy',
            command: () => {
                if (data?.image_src.startsWith("http") ||
                    data?.image_src.startsWith("https")) {
                    navigator.clipboard.writeText(data.image_src);
                } else {
                    navigator.clipboard.writeText(import.meta.env.VITE_IMAGE_URL + data?.image_src);
                }
            }
        }
    ];

    if (!data) return null;

    return (
        <div className="issue-page">
            {isLoading ?
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
                :
                <>
                    <Toast ref={toast} />
                    <ConfirmPopup />
                    {isAdmin(user) && (
                        <>
                            <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
                            <SpeedDial
                                model={dialItems}
                                direction="up"
                                className="fixed-dial"
                                showIcon="pi pi-plus"
                                hideIcon="pi pi-times"
                                buttonClassName="p-button-primary"
                            />
                        </>
                    )}
                    <Dialog maximizable blockScroll
                        className="w-full xl:w-6"
                        visible={issueFormVisible}
                        onShow={onDialogShow}
                        onHide={onDialogHide}
                        header="Muokkaa numeroa">
                        <IssueForm
                            issueid={issueId}
                            magazineid={data.magazine.id}
                            onSubmitCallback={onFormSubmit}
                        />
                    </Dialog>
                    <Dialog maximizable blockScroll className="w-full xl:w-9"
                        header="Novellien muokkaus"
                        visible={shortsFormVisible}
                        //onShow={() => onShortsShow()}
                        onHide={() => onShortsHide()}
                    >
                        <IssueShortsPicker
                            id={data.id?.toString()}
                            onClose={() => onShortsHide()}
                        />
                    </Dialog>
                    <Dialog maximizable blockScroll className="w-full xl:w-9"
                        header="Artikkelien muokkaus"
                        visible={articleFormVisible}
                        //onShow={() => onArticlesShow()}
                        onHide={() => onArticlesHide()}
                    >
                    </Dialog>
                    <div className="grid">
                        <div className="col-12">
                            <Card className="shadow-3">
                                <div className="grid pl2- pr-2 pt-0">
                                    <div className="col-12 lg:col-9">
                                        <div className="flex-column">
                                            <IssueInfo issue={data} />
                                        </div>
                                    </div>
                                    <div className="col-12 lg:col-3">
                                        {(data.image_src && issueId) ? (
                                            <>
                                                <ContextMenu model={imageItems} ref={cm} />
                                                <Image
                                                    className="pt-2"
                                                    preview
                                                    width="150px"
                                                    src={data.image_src?.startsWith('http') ? data.image_src : import.meta.env.VITE_IMAGE_URL + data.image_src}
                                                    onContextMenu={(e) => cm.current?.show(e)}
                                                />
                                            </>
                                            // <ImageView
                                            //     itemId={issueId}
                                            //     images={strToImageType(data.image_src)}
                                            //     idx={0}
                                            //     deleteFunc={deleteImage}
                                            //     idxCb={
                                            //         (idx: number) => {

                                            //         }
                                            //     }
                                            // />
                                        ) : isAdmin(user) &&
                                        <FileUpload
                                            id={"issue-image-" + issueId}
                                            mode="basic"
                                            accept='image/*'
                                            name="image"
                                            uploadLabel='Lisää kuva'
                                            auto
                                            customUpload
                                            uploadHandler={saveImage}
                                        />
                                        }
                                    </div>
                                </div>
                                {/* Links section */}
                                {data.link && (
                                    <div className="mt-4 pt-3 border-top-1 surface-border">
                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href={data.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="no-underline text-primary hover:text-primary-700 flex align-items-center gap-2"
                                            >
                                                <span>{data.link}</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 pt-3 border-top-1 surface-border">
                                    <div className="flex flex-wrap gap-3">
                                        <Link to={`/magazines/${data.magazine.id}`}
                                            className="no-underline text-primary hover:text-primary-700 flex align-items-center gap-2"
                                        >Takaisin</Link>
                                    </div>
                                </div>

                            </Card>
                        </div>
                        <div className="col-12">
                            <TabView className="shadow-2" scrollable={true}>
                                <TabPanel header="Sisältö" leftIcon="pi pi-book">
                                    <div className="card">
                                        {data.stories.length > 0 && (
                                            <div className="p-ml-3">
                                                {data.stories.map((story) => (
                                                    <div key={story.id + data.id}>
                                                        <ShortSummary key={story.id}
                                                            short={story}
                                                        />
                                                    </div>
                                                )
                                                )
                                                }
                                            </div>
                                        )
                                        }

                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>
                    </div>
                </>
            }
        </div >
    )
}
