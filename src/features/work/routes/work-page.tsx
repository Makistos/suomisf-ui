import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";

import { Image } from "primereact/image";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { Panel } from "primereact/panel";
import { Ripple } from "primereact/ripple";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { ContextMenu } from "primereact/contextmenu";
import { MenuItem } from "primereact/menuitem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Edition, EditionString, EditionDetails } from "../../edition";
//import { IMAGE_URL } from "../../../systemProps";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent, postApiContent, deleteApiContent } from "../../../services/user-service";
import { ShortsList } from "../../short";
import { Work } from "../types";
import { WorkDetails } from "../components/work-details";
import { EditionForm } from "../../edition/components/edition-form";
import { isAnthology } from "../utils/is-anthology";
import { selectId } from "../../../utils";
import { useDocumentTitle } from '../../../components/document-title';
import { WorkForm } from "../components/work-form";
import { User } from "../../user";
import { isDisabled } from '../../../components/forms/forms';
import authHeader from "../../../services/auth-header";

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

const ImageView = ({ edition }: ImageViewProps) => {
    const editionId = edition.id;
    const imageUploadUrl = `editions/${editionId}/images/${edition.images[0].id}`;
    const cm = useRef<ContextMenu>(null);
    const imageItems = [
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: () => {
                console.log(imageUploadUrl);
                deleteApiContent(imageUploadUrl);
            }
        }
    ];

    return (
        <>
            <ContextMenu model={imageItems} ref={cm} />
            <Image className="pt-2" preview width="100px" src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src}
                onContextMenu={(e) => cm.current?.show(e)}
            />
        </>
    )
}

export const WorkPage = ({ id }: WorkPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    //const [work, setWork]: [Work | null, (work: Work) => void] = useState<Work | null>(null);
    //const [layout, setLayout]: [DataViewLayoutType, (layout: DataViewLayoutType) => void] = useState<DataViewLayoutType>('list');
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [formData, setFormData] = useState<Work | null>(null);
    const [editWork, setEditWork] = useState(true);
    const [isEditionFormVisible, setEditionFormVisible] = useState(false);
    const toast = useRef<Toast>(null);

    const ConfirmNewWork = () => {
        confirmDialog({
            message: 'Tähän tulee uuden teoksen lisäys-näkymä',
            header: 'Uuden teoksen lisääminen',
            icon: 'fa-solid fa-circle-plus'
        });
    };

    try {
        workId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }

    const fetchWork = async (id: string, user: User | null): Promise<Work> => {
        let url = baseURL + workId;
        const data = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        console.log(data)
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["work", workId],
        queryFn: () => fetchWork(workId, user),
        enabled: queryEnabled
    })

    useEffect(() => {
        if (data !== undefined && data !== null) {
            setDocumentTitle(data.title);
        }
    }, [data]);

    const ConfirmEdit = () => {
        confirmDialog({
            message: 'Tähän tulee teoksen muokkaus-näkymä',
            header: 'Teoksen muokkaaminen',
            icon: 'fa-solid fa-pen-to-square'
        });
    };
    const ConfirmNewEdition = () => {
        confirmDialog({
            message: 'Tähän tulee uuden painoksen lisäys-näkymä',
            header: 'Uuden painoksen lisääminen',
            icon: 'fa-solid fa-circle-plus'
        });
    };

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
                //ConfirmNewEdition();
            }
        },
        {
            label: 'Muokkaa novelleja',
            icon: 'fa-solid fa-list-ul',
            disabled: !(data !== undefined && data !== null &&
                data.stories !== null &&
                data.stories.length > 0),
            command: () => {

            }
        },
        {
            label: "Poista",
            icon: 'fa-solid fa-trash',
            disabled: !(data !== undefined && data !== null &&
                data.editions !== null &&
                data.editions.length === 1),
            command: () => {

            }
        }
    ]
    // useEffect(() => {
    //     async function getWork() {
    //         let url = baseURL + workId;
    //         try {
    //             const response = await getApiContent(url, user);
    //             setWork(response.data);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }
    //     getWork();
    // }, [params.workId, user])

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
        console.log(imageUploadUrl);
        const customSave = async (event: FileUploadHandlerEvent) => {
            const form = new FormData();
            form.append('file', event.files[0], event.files[0].name);
            const file = event.files[0];
            const request = { file: file, filename: file.name };
            const headers = authHeader();

            const response = await axios.post(process.env.REACT_APP_API_URL + imageUploadUrl,
                form, {
                headers: headers
            });
        }

        const onUpload = () => {
            toast.current?.show({ severity: 'info', summary: 'Success', detail: 'Kuva tallennettu' });
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

    // const renderGridItem = (edition: Edition) => {
    //     return (
    //         <div className="col-12 md:col-4 editioncard">
    //             <div className="editionheader">
    //                 <div className="editionnum">
    //                     {EditionString(edition)}
    //                 </div>
    //             </div>
    //             <div className="editionimage">
    //                 {edition.images.length > 0 &&
    //                     <Image preview height="250px"
    //                         src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src}
    //                         alt={EditionString(edition) + " kansikuva"}
    //                     />
    //                 }
    //             </div>
    //             <div className="editioncontent">
    //                 <p className="editiontitle">{edition.title}</p>
    //                 <EditionDetails edition={edition} />
    //             </div>
    //             <div className="editionfooter">
    //             </div>
    //         </div>
    //     )
    // }


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

    const onEditionDialogShow = () => {
        setEditionFormVisible(true);
        setQueryEnabled(false)
    }

    const onEditionDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
        setQueryEnabled(true);
        setEditionFormVisible(false);
    }

    if (!data) return null;

    const anthology = isAnthology(data);


    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {/* user !== null && user.is_admin && ( */}
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
                {/* ) */}
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Teoksen muokkaus" visible={isEditVisible}
                    onShow={() => onDialogShow()}
                    onHide={() => onDialogHide()}
                >
                    <WorkForm data={!formData || !editWork ? null : formData} onSubmitCallback={onDialogHide} />
                </Dialog>
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Uusi painos" visible={isEditionFormVisible}
                    onShow={() => onEditionDialogShow()}
                    onHide={() => onEditionDialogHide()}
                >
                    <EditionForm edition={null} work={data} onSubmitCallback={onEditionDialogHide} />
                </Dialog>
                {
                    isLoading ?
                        <div className="progressbar">
                            <ProgressSpinner />
                        </div>
                        : (data && (
                            <>
                                <WorkDetails work={data} />
                                {data.stories.length > 0 && (
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
                            </>
                        ))}
            </div>
        </main>
    )
}