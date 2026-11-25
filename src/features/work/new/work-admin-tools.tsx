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
import { EditionForm } from "@features/edition/components/edition-form";
import { WorkShortsPicker } from "@features/short/components/shorts-picker";
import { AwardedForm } from "@features/award/components/awarded-form";
import { Work } from "../types";
import { WorkForm } from "../components/work-form";
import { WorkOmnibusPicker } from "../components/omnibus-picker";
import { AntikvaariProductPicker } from "../components/antikvaari-product-picker";

type Dialogs = "new" | "edit" | "edition" | "stories" | "omnibus" | "awards" | "prices" | null;

/** The admin's tools on the new work page: the same SpeedDial and dialogs as on the current page. */
export const WorkAdminTools = ({ work, workId, onFormOpen }: {
    work: Work;
    /** The id the work query is keyed with. */
    workId: string;
    /** The work query is paused while a form is open, as on the current page, so a refetch can't reset the form. */
    onFormOpen: (open: boolean) => void;
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const showGlobalToast = useGlobalToast();
    const toastRef = useRef<Toast>(null);
    const [open, setOpenState] = useState<Dialogs>(null);
    const [priceSource, setPriceSource] = useState("Antikvaari");
    const setOpen = (d: Dialogs) => { setOpenState(d); onFormOpen(d === "new" || d === "edit" || d === "edition"); };
    const close = () => { setOpen(null); queryClient.invalidateQueries({ queryKey: ["work", workId] }); };
    const saved = (status: boolean, message: string) => {
        close();
        toastRef.current?.show(status
            ? { severity: "success", summary: "Tallentaminen onnistui", detail: "Tietojen päivitys onnistui", life: 4000 }
            : { severity: "error", summary: "Tietojen tallentaminen epäonnistui", detail: message, life: 6000 });
    };

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteApiContent(`works/${id}`),
        onSuccess: (data: HttpStatusResponse) => {
            if (data.status === 200) {
                showGlobalToast({ severity: "success", summary: "Teos poistettu" });
                navigate(-1);
            } else {
                toastRef.current?.show({ severity: "error", summary: "Teoksen poisto ei onnistunut", detail: data.response });
            }
        },
    });

    const items = [
        { label: "Uusi teos", icon: "fa-solid fa-circle-plus", command: () => setOpen("new") },
        { label: "Muokkaa", icon: "fa-solid fa-pen-to-square", command: () => setOpen("edit") },
        {
            label: "Poista", icon: "fa-solid fa-trash", disabled: work.editions === null,
            command: () => confirmDialog({
                message: "Haluatko varmasti poistaa teoksen?", header: "Varmistus", icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger", accept: () => remove(work.id),
                reject: () => toastRef.current?.show({ severity: "info", summary: "Teosta ei poistettu" }),
            }),
        },
        { label: "Palkinnot", icon: "fa-solid fa-trophy", command: () => setOpen("awards") },
        { label: "Uusi painos", icon: "fa-solid fa-file-circle-plus", command: () => setOpen("edition") },
        { label: "Muokkaa novelleja", icon: "fa-solid fa-list-ul", command: () => setOpen("stories") },
        { label: "Muokkaa kokoomateosta", icon: "pi pi-server", command: () => setOpen("omnibus") },
        { label: "Hinnat", icon: "fa-solid fa-magnifying-glass-dollar", command: () => setOpen("prices") },
    ];

    return (
        <>
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
            <SpeedDial model={items} direction="up" className="fixed-dial" showIcon="pi pi-plus" hideIcon="pi pi-times"
                buttonClassName="p-button-primary" />
            <Dialog maximizable blockScroll className="w-full xl:w-6" header={open === "new" ? "Uusi teos" : "Teoksen muokkaus"}
                visible={open === "new" || open === "edit"} onHide={close}>
                {(open === "new" || open === "edit") && <WorkForm workId={open === "edit" ? workId : null} onSubmitCallback={saved} />}
            </Dialog>
            <Dialog maximizable blockScroll className="w-full xl:w-6" header="Uusi painos" visible={open === "edition"} onHide={close}>
                {open === "edition" && <EditionForm editionid={null} work={work} onSubmitCallback={saved} />}
            </Dialog>
            <Dialog maximizable blockScroll closeOnEscape className="w-full xl:w-6" header="Novellit" visible={open === "stories"} onHide={close}>
                {open === "stories" && <WorkShortsPicker id={workId} onClose={close} />}
            </Dialog>
            <Dialog maximizable blockScroll closeOnEscape className="w-full xl:w-6" header="Kokoomateos" visible={open === "omnibus"} onHide={close}>
                {open === "omnibus" && <WorkOmnibusPicker id={workId} onClose={close} />}
            </Dialog>
            <Dialog maximizable blockScroll closeOnEscape className="w-full xl:w-6" header="Palkinnot" visible={open === "awards"} onHide={close}>
                {open === "awards" && <AwardedForm workId={String(work.id)} onClose={close} />}
            </Dialog>
            <Dialog blockScroll closeOnEscape className="w-full xl:w-5" header={`${priceSource}-hinnat`} visible={open === "prices"} onHide={close}>
                {open === "prices" && <AntikvaariProductPicker work={work} onClose={close} onSourceChange={setPriceSource} />}
            </Dialog>
        </>
    );
};
