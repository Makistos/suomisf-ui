import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";

import { useGlobalToast } from "@components/global-toast";
import { deleteApiContent, type HttpStatusResponse } from "@services/user-service";
import { AwardedForm } from "@features/award/components/awarded-form";
import { ShortsForm } from "../components";
import { Short } from "../types";

/** The admin's tools on the new short story page: the same SpeedDial and dialogs as on the current page (Muokkaa, Palkinnot, Poista). */
export const ShortAdminTools = ({ short, shortId, onFormOpen }: {
    short: Short;
    /** The id the short query is keyed with. */
    shortId: string;
    /** The query is paused while the form is open, as on the current page, so a refetch can't reset the form. */
    onFormOpen: (open: boolean) => void;
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const showGlobalToast = useGlobalToast();
    const toastRef = useRef<Toast>(null);
    const [open, setOpenState] = useState<"edit" | "awards" | null>(null);
    const setOpen = (d: "edit" | "awards" | null) => { setOpenState(d); onFormOpen(d === "edit"); };
    const close = () => { setOpen(null); queryClient.invalidateQueries({ queryKey: ["short", shortId] }); };

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteApiContent(`shorts/${id}`),
        onSuccess: (data: HttpStatusResponse) => {
            if (data.status === 200) {
                showGlobalToast({ severity: "success", summary: "Novelli poistettu" });
                navigate(-1);
            } else {
                toastRef.current?.show({ severity: "error", summary: "Novellin poisto ei onnistunut", detail: data.response });
            }
        },
    });

    const items = [
        { label: "Muokkaa", icon: "pi pi-pencil", command: () => setOpen("edit") },
        { label: "Palkinnot", icon: "fa-solid fa-trophy", command: () => setOpen("awards") },
        {
            label: "Poista", icon: "fa-solid fa-trash",
            command: () => confirmDialog({
                message: "Haluatko varmasti poistaa novellin?", header: "Varmistus", icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger", accept: () => remove(short.id),
                reject: () => toastRef.current?.show({ severity: "info", summary: "Novellia ei poistettu" }),
            }),
        },
    ];

    return (
        <>
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
            <SpeedDial model={items} direction="up" className="fixed-dial" showIcon="pi pi-plus" hideIcon="pi pi-times" buttonClassName="p-button-primary" />
            <Dialog maximizable blockScroll className="w-full xl:w-6" header="Muokkaa" visible={open === "edit"} onHide={close}>
                {open === "edit" && (
                    <ShortsForm short={short}
                        onSubmitCallback={() => { toastRef.current?.show({ severity: "success", summary: "Tallentaminen onnistui" }); close(); }}
                        onClose={close}
                        onDelete={() => { queryClient.invalidateQueries({ queryKey: ["short", shortId] }); navigate(-1); }} />
                )}
            </Dialog>
            <Dialog maximizable blockScroll className="w-full xl:w-6" header="Palkinnot" visible={open === "awards"} onHide={close} closeOnEscape>
                {open === "awards" && <AwardedForm shortId={String(short.id)} onClose={close} />}
            </Dialog>
        </>
    );
};
