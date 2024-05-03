import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Image } from "primereact/image";
import { DataView } from "primereact/dataview";
import { Panel } from "primereact/panel";
import { Ripple } from "primereact/ripple";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { ContextMenu } from "primereact/contextmenu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Edition, EditionDetails } from "../../edition";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent, deleteApiContent } from "../../../services/user-service";
import { ShortsList } from "../../short";
import { Work } from "../types";
import { WorkDetails } from "../components/work-details";
import { EditionForm } from "../../edition/components/edition-form";
import { isAnthology } from "../utils/is-anthology";
import { selectId } from "../../../utils";
import { useDocumentTitle } from '../../../components/document-title';
import { WorkForm } from "../components/work-form";
import { User, isAdmin } from "../../user";
import { isDisabled } from '../../../components/forms/forms';
import authHeader from "../../../services/auth-header";
import { HttpStatusResponse } from "../../../services/user-service"
import { WorkShortsPicker } from "../../short/components/shorts-picker";
import { WorkChanges } from "../../changes/components/work-changes";
import { Divider } from "primereact/divider";

export interface WorkProps {
    work: Work,
    detailLevel?: string,
    orderField?: string
}

const baseURL = "works/";

interface WorkPageProps {
    id: string | null;
}

let workId = "";

interface ImageViewProps {
    edition: Edition
}

/**
 * Renders an image view component.
 *
 * @param {ImageViewProps} edition - The edition object containing image data.
 * @return {JSX.Element} The rendered image view component.
 */
const ImageView = ({ edition }: ImageViewProps) => {
    const editionId = edition.id;
    const imageUploadUrl = `editions/${editionId}/images/${edition.images[0].id}`;
    const cm = useRef<ContextMenu>(null);
    const imageItems = [
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: () => {
                //console.log(imageUploadUrl);
                deleteApiContent(imageUploadUrl);
            }
        }
    ];

    return (
        <>
            <ContextMenu model={imageItems} ref={cm} />
            <Image className="pt-2" preview width="100px" src={import.meta.env.VITE_IMAGE_URL + edition.images[0].image_src}
                onContextMenu={(e) => cm.current?.show(e)}
            />
        </>
    )
}

export const WorkPage = ({ id }: WorkPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [isShortsFormVisible, setIsShortsFormVisible] = useState(false);
    const [formData, setFormData] = useState<Work | null>(null);
    const [editWork, setEditWork] = useState(true);
    const [isEditionFormVisible, setEditionFormVisible] = useState(false);
    const toastRef = useRef<Toast>(null);
    const navigate = useNavigate();

    try {
        workId = selectId(params, id);
    } catch (e) {
        console.log(`${e} work`);
    }

    const fetchWork = async (id: string, user: User | null): Promise<Work> => {
        let url = baseURL + workId;
        const data: Work = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["work"],
        queryFn: () => fetchWork(workId, user),
        enabled: queryEnabled
    })

    const deleteWork = (id: number) => {
        setQueryEnabled(false);
        const retval = deleteApiContent('works/' + id);
        setQueryEnabled(true);
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: number) => deleteWork(values),
        onSuccess: (data: HttpStatusResponse) => {
            const msg = data.response;
            if (data.status === 200) {
                navigate(-1);
                toastRef.current?.show({ severity: 'success', summary: 'Teos poistettu' })
            } else {
                toastRef.current?.show({ severity: 'error', summary: 'Teoksen poisto ei onnistunut', detail: msg })
            }
        },
        onError: (error: any) => {
            const errMsg = JSON.parse(error.response).data["msg"];
            console.log(errMsg);
            toastRef.current?.show({ severity: 'error', summary: 'Teoksen poistaminen ei onnistunut', detail: errMsg })
        }
    })

    const dialItems = [
        {
            label: 'Uusi teos',
            icon: 'fa-solid fa-circle-plus',
            command: () => {
                setEditWork(false);
                setFormData(null);
                setEditVisible(true);
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                if (data) {
                    setEditWork(true);
                    setFormData(data);
                    setEditVisible(true);
                }
            }
        },
        {
            label: 'Uusi painos',
            icon: 'fa-solid fa-file-circle-plus',
            command: () => {
                setEditionFormVisible(true);
            }
        },
        {
            label: 'Muokkaa novelleja',
            icon: 'fa-solid fa-list-ul',
            // disabled: !(data !== undefined && data !== null &&
            //     data.work_type.id === 2),
            command: () => {
                setIsShortsFormVisible(true);

            }
        },
        {
            label: "Poista",
            icon: 'fa-solid fa-trash',
            disabled: !(data !== undefined && data !== null &&
                data.editions !== null),
            command: () => {
                confirmDialog({
                    message: 'Haluatko varmasti poistaa teoksen?',
                    header: 'Varmistus',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: () => {
                        if (data && data.id !== null) {
                            mutate(data.id);
                        }
                    },
                    reject: () => {
                        toastRef.current?.show({
                            severity: 'info',
                            summary: 'Teosta ei poistettu'
                        })
                    }
                })

            }
        }
    ]

    const queryClient = useQueryClient();
    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.title);
    }, [data])

    const renderListItem = (edition: Edition, work?: Work) => {
        const imageUploadUrl = `editions/${edition.id}/images`;
        const eIdx = work?.editions.findIndex(e => e.id === edition.id);
        if (eIdx === undefined || eIdx === null || eIdx == -1) {
            return null;
        }
        const editionIdx: number = eIdx;
        const customSave = async (event: FileUploadHandlerEvent) => {
            const form = new FormData();
            form.append('file', event.files[0], event.files[0].name);
            const file = event.files[0];
            const request = { file: file, filename: file.name };
            const headers = authHeader();

            const response = await axios.post(import.meta.env.VITE_API_URL + imageUploadUrl,
                form, {
                headers: headers
            });
        }

        const onUpload = () => {
            toastRef.current?.show({ severity: 'info', summary: 'Success', detail: 'Kuva tallennettu' });
        }
        return (
            (work &&
                <div className="col-12">
                    <div className="grid">
                        <div className="col-8" >
                            <EditionDetails edition={edition} card work={work} />
                        </div>
                        <div className="flex col-4 justify-content-end align-content-center">
                            {edition.images.length > 0 ?
                                <ImageView edition={edition} />
                                :
                                isAdmin(user) &&
                                <FileUpload
                                    id={"editionimage_" + edition.id}
                                    mode="basic"
                                    accept="image/*"
                                    name="image"
                                    uploadLabel="Lisää kuva"
                                    auto
                                    customUpload
                                    uploadHandler={customSave}
                                    onUpload={onUpload}
                                    disabled={isDisabled(user, isLoading)}
                                />
                            }
                        </div>
                    </div>
                </div>
            )
        )
    }

    const itemTemplate = (edition: Edition) => {
        if (!edition) {
            return;
        }
        return renderListItem(edition, data);
    }

    const renderHeader = () => {
        return (<> </>
            // <div className="grid grid-nogutter">
            //     <div className="col" style={{ textAlign: 'left' }}>
            //         <DataViewLayoutOptions layout={layout}
            //             onChange={(e: DataViewLayoutOptionsChangeParams) => setLayout(e.value)} />
            //     </div>
            // </div>
        )
    }

    const header = renderHeader();

    /**
     * Generates the panel template based on the given options.
     *
     * @param {any} options - The options for generating the panel template.
     * @return {JSX.Element} - The panel template as a JSX element.
     */
    const panelTemplate = (options: any) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        const className = `${options.className} justify-content-start`;
        const titleClassName = `${options.titleClassName} pl-1`;

        return (
            <div className={className}>
                <span className={titleClassName}>
                    Novellit
                </span>
                <button className={options.togglerClassName} onClick={options.onTogglerClick}>
                    <span className={toggleIcon}></span>
                    <Ripple />
                </button>
            </div>
        )
    }

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false)
    }

    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
        setQueryEnabled(true);
        setEditVisible(false);
    }

    const workFormCallback = (status: boolean, message: string) => {
        onDialogHide();
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 4000 });
        }
    }
    const onEditionDialogShow = () => {
        setEditionFormVisible(true);
        setQueryEnabled(false)
    }

    const onEditionDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
        setQueryEnabled(true);
        setEditionFormVisible(false);
    }

    const onShortsFormShow = () => {
        setIsShortsFormVisible(true);
    }

    const onShortsFormHide = () => {
        setIsShortsFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ["work"] });
    }

    if (!data) return null;

    const anthology = isAnthology(data);


    return (
        <main className="all-content">
            <ConfirmDialog />
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {/* user !== null && user.is_admin && ( */}
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action">

                        </Tooltip>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction="left"
                            type="semi-circle"
                            radius={80}
                        />
                    </div>
                }
                <Toast ref={toastRef} />
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Teoksen muokkaus" visible={isEditVisible}
                    onShow={() => onDialogShow()}
                    onHide={() => onDialogHide()}
                >
                    {/* <WorkForm data={!formData || !editWork ? null : formData} onSubmitCallback={workFormCallback} /> */}
                    <WorkForm workId={!formData || !editWork ? null : formData.id} onSubmitCallback={workFormCallback} />
                </Dialog>
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Uusi painos" visible={isEditionFormVisible}
                    onShow={() => onEditionDialogShow()}
                    onHide={() => onEditionDialogHide()}
                >
                    <EditionForm edition={null} work={data} onSubmitCallback={onEditionDialogHide} />
                </Dialog>
                <Dialog maximizable blockScroll
                    className="w-full xl:x-6"
                    header="Novellit" visible={isShortsFormVisible}
                    onShow={() => onShortsFormShow()}
                    onHide={() => onShortsFormHide()}
                    closeOnEscape
                >
                    <WorkShortsPicker id={workId} onClose={() => onShortsFormHide()} />
                </Dialog>
                {
                    isLoading ?
                        <div className="progressbar">
                            <ProgressSpinner />
                        </div>
                        : (data && (
                            <>
                                <WorkDetails work={data} />
                                {data.stories !== undefined && data.stories.length > 0 && (
                                    <div className="mb-3">
                                        <Panel header="Novellit"
                                            headerTemplate={panelTemplate}
                                            toggleable collapsed>
                                            <ShortsList shorts={data.stories} person={data.authors[0]}
                                                anthology={anthology}
                                            />
                                        </Panel>
                                    </div>
                                )}
                                <div className="mt-5 mb-0">
                                    <h2 className="mb-0">Painokset</h2>
                                    <div className="mt-0">
                                        <DataView value={data.editions}
                                            header={header} itemTemplate={itemTemplate} />
                                    </div>
                                </div>
                                <Divider />
                                <div className="mt-5 mb-0">
                                    <WorkChanges workId={data.id ? data.id : 0} />
                                </div>
                            </>
                        ))}
            </div>
        </main>
    )
}