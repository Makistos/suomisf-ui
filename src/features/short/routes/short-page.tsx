import { getShort } from "@api/short/get-short"
import { useDocumentTitle } from "@components/document-title"
import { GenreGroup } from "@features/genre"
import { TagGroup } from "@features/tag"
import { getCurrenUser } from "@services/auth-service"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { selectId } from "@utils/select-id"
import { ProgressSpinner } from "primereact/progressspinner"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ShortsForm } from "../components"
import { Dialog } from "primereact/dialog"
import { Toast } from "primereact/toast"
import { SpeedDial } from "primereact/speeddial"
import { isAdmin, User } from "@features/user"
import { EditionSummary } from "@features/edition"
import { Tooltip } from "primereact/tooltip"
import { Card } from "primereact/card"
import { TabPanel, TabView } from "primereact/tabview"
import { ShortDetails } from "../components/short-defails"
import { SimilarShorts } from "../components/similar-shorts"
import { useSimilarShorts } from "../hooks/use-similar-shorts"
import { on } from "stream"
import { editionIsOwned } from "@features/edition/utils/edition-is-owned"
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog"
import { deleteApiContent, HttpStatusResponse } from "@services/user-service"
import { set } from "lodash"
import { AwardedForm } from "@features/award/components/awarded-form"
import { AwardList } from "@features/award"
import { appearsIn } from "@utils/appears-in"
import { removeDuplicateContributions } from "@utils/remove-duplicate-contributions"

interface ShortPageProps {
    id: string | null
}

export const ShortPage = (props: ShortPageProps) => {
    const user = useMemo(() => getCurrenUser(), [])
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [shortFormVisible, setShortFormVisible] = useState(false);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isAwardsFormVisible, setAwardsFormVisible] = useState(false);
    const params = useParams();
    let thisId = "";
    const toastRef = useRef<Toast>(null);
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    try {
        thisId = selectId(params, props.id);
    } catch (e) {
        console.log(`${e} short`);
    }

    const { hasSimilarShorts } = useSimilarShorts(thisId, user);

    const fetchShort = async (id: string, user: User | null) => {
        const response = await getShort(thisId, user);
        return response
    }
    const { isLoading, data } = useQuery({
        queryKey: ['short', thisId],
        queryFn: () => fetchShort(thisId, user),
        enabled: queryEnabled
    })

    useEffect(() => {
        if (data !== undefined && data !== null) {
            setDocumentTitle(data.title);
        }
    }, [data])

    const deleteShort = (id: number) => {
        setQueryEnabled(false);
        console.log("delete: " + id)
        const retval = deleteApiContent('shorts/' + id);
        setQueryEnabled(true);
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: number) => deleteShort(values),
        onSuccess: (data: HttpStatusResponse) => {
            const msg = data.response;
            if (data.status === 200) {
                navigate(-1);
                toastRef.current?.show({ severity: 'success', summary: 'Novelli poistettu' })
            } else {
                toastRef.current?.show({ severity: 'error', summary: 'Novellin poisto ei onnistunut', detail: msg })
            }
        },
        onError: (error: any) => {
            const errMsg = JSON.parse(error.response).data["msg"];
            console.log(errMsg);
            toastRef.current?.show({ severity: 'error', summary: 'Novellin poistaminen ei onnistunut', detail: errMsg })
        }
    })
    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'pi pi-pencil',
            command: () => setShortFormVisible(true)
        },
        {
            label: 'Palkinnot',
            icon: 'fa-solid fa-trophy',
            command: () => {
                setAwardsFormVisible(true);

            }
        },
        {
            label: "Poista",
            icon: 'fa-solid fa-trash',
            disabled: !(data !== undefined && data !== null &&
                data.editions !== null),
            command: () => {
                confirmDialog({
                    message: 'Haluatko varmasti poistaa novellin?',
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
                            summary: 'Novellia ei poistettu'
                        })
                    }
                })
            }
        }
    ]

    const onShow = () => {
        setQueryEnabled(false);

    }

    const onHide = () => {
        queryClient.invalidateQueries({ queryKey: ['short', data?.id] });
        setShortFormVisible(false);
        setQueryEnabled(true);
    }

    const onNewShort = (id: string, visible: boolean) => {
        toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui' });
        onHide();
    }

    const shortDeleted = () => {
        queryClient.invalidateQueries({ queryKey: ['short', thisId] });
        navigate(-1);
    }

    const onAwardsFormShow = () => {
        setAwardsFormVisible(true);
    }
    const onAwardsFormHide = () => {
        setAwardsFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ["short", thisId] });
    }

    if (!data) return null;

    return (
        <main className="person-page">
            <Toast ref={toastRef} />
            <ConfirmDialog />
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
            {isLoading ? (
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
            ) : (
                < div className="grid">
                    {/* Header Section */}
                    <div className="col-12">
                        <Card className="shadow-3">
                            <div className="grid pl-2 pr-2 pt-0">
                                <div className="col-12 lg:col-9">
                                    <div className="flex-column">
                                        <ShortDetails short={data} />
                                    </div>
                                </div>
                                <div className="col-12 lg:col-3">
                                    <div className="flex flex-column gap-4">
                                        <div className="flex flex-column gap-2 pt-3 border-bottom-1">
                                            <span className="font-bold">
                                                {data.type.name}<br />
                                            </span>
                                        </div>
                                        <div className="flex flex-column gap-2">
                                            <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                            <GenreGroup
                                                genres={data.genres}
                                                showOneCount
                                                className="flex-wrap"
                                            />
                                        </div>

                                        {data.tags && data.tags.length > 0 && (
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Asiasanat</h3>
                                                <TagGroup
                                                    tags={data.tags}
                                                    overflow={5}
                                                    showOneCount
                                                />
                                            </div>
                                        )}
                                        {appearsIn(data.contributors) && (
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Henkilöt</h3>
                                                {appearsIn(removeDuplicateContributions(data.contributors))?.map(contrib => (
                                                    <>{contrib}
                                                        <br />
                                                    </>
                                                )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="col-12">
                        <TabView className="shadow-2" scrollable={true}>
                            <TabPanel header="Julkaisut" leftIcon="pi pi-book">
                                <div className="card">
                                    {data.editions && data.editions.length > 0 && (
                                        <div className="mb-3">
                                            <h3 className="text-sm uppercase text-600 m-0 mb-1">Kirjat</h3>
                                            {data.editions.map(edition => (
                                                <span key={edition.id}>
                                                    <EditionSummary edition={edition}
                                                        showPerson={true}
                                                        showVersion={true}
                                                        work={edition.work[0]}
                                                        isOwned={editionIsOwned(edition, user)} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {data.issues && data.issues.length > 0 && (
                                        <div>
                                            <h3 className="text-sm uppercase text-600 m-0 mb-1">Lehdet</h3>
                                            {data.issues.map(issue => (
                                                <div className="book not-owned"
                                                    key={`issue-${issue.id}-link`}>
                                                    <Link to={`/issues/${issue.id}`}
                                                        key={`issue-${issue.id}-link`}>
                                                        {issue.magazine.name} {issue.cover_number}.
                                                        <br />
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>)}
                                </div>
                            </TabPanel>
                            {/* Add new Awards tab */}
                            {data.awards && data.awards.length > 0 && (
                                <TabPanel header="Palkinnot" leftIcon="pi pi-trophy">
                                    <div className="card">
                                        <AwardList awards={data.awards} />
                                    </div>
                                </TabPanel>
                            )}
                            {hasSimilarShorts && (
                                <TabPanel header="Muut käännökset" leftIcon="pi pi-copy">
                                    <div className="card">
                                        <SimilarShorts shortId={data.id} user={user} />
                                    </div>
                                </TabPanel>
                            )}
                        </TabView>
                    </div>
                    <Dialog maximizable blockScroll
                        className="w-full xl:w-6"
                        visible={shortFormVisible}
                        onShow={onShow}
                        onHide={onHide}
                        header="Muokkaa">
                        <ShortsForm short={data}
                            onSubmitCallback={onNewShort}
                            onClose={() => onHide()}
                            onDelete={() => shortDeleted()}
                        />
                    </Dialog>
                    <Dialog maximizable blockScroll
                        className="w-full xl:w-6"
                        header="Palkinnot" visible={isAwardsFormVisible}
                        onShow={() => onAwardsFormShow()}
                        onHide={() => onAwardsFormHide()}
                        closeOnEscape
                    >
                        <AwardedForm
                            shortId={data.id.toString()}
                            onClose={() => onAwardsFormHide()}
                        />
                    </Dialog>

                </div>
            )
            }
        </main >
    )
}
