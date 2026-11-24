import { lazy, Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";

import type { Person } from "../types";
import { PersonForm } from "../components/person-form";
import { PersonImagePickerDialog } from "../components/person-image-picker-dialog";
import { AwardedForm } from "@features/award/components/awarded-form";
import { deleteApiContent, type HttpStatusResponse } from "../../../services/user-service";

const WorkForm = lazy(() => import("@features/work/components/work-form").then(m => ({ default: m.WorkForm })));

type Props = {
    person: Person;
    issueCount: number;
    /** Work whose edit dialog is open (the pencil after a title), or null. */
    editWorkId: number | null;
    onEditWorkClose: () => void;
    /** The person query is paused while the person form is open, as on the current page, so a refetch can't reset the form. */
    onFormOpen: (open: boolean) => void;
};

/** The admin's tools on the new person page: the same SpeedDial and dialogs as on the current page. */
export const PersonAdminTools = ({ person, issueCount, editWorkId, onEditWorkClose, onFormOpen }: Props) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const toastRef = useRef<Toast>(null);
    const [form, setFormState] = useState<"new" | "edit" | null>(null);
    const setForm = (f: "new" | "edit" | null) => { setFormState(f); onFormOpen(f !== null); };
    const [awardsVisible, setAwardsVisible] = useState(false);
    const [imageVisible, setImageVisible] = useState(false);
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["person", String(person.id)] });

    // Deletable only when nothing references the person; the backend checks this too.
    const linked = [person.works, person.translations, person.edits, person.articles, person.stories,
        person.magazine_stories, person.awarded, person.editions, person.aliases, person.real_names]
        .some(items => (items?.length ?? 0) > 0) || issueCount > 0;

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteApiContent("people/" + id),
        onSuccess: (response: HttpStatusResponse) => {
            if (response.status === 200) {
                toastRef.current?.show({ severity: "success", summary: "Henkilö poistettu" });
                navigate("/people");
            } else {
                toastRef.current?.show({ severity: "error", summary: "Henkilön poisto ei onnistunut", detail: response.response, life: 6000 });
            }
        },
        onError: (error: Error) => toastRef.current?.show({ severity: "error", summary: "Henkilön poisto ei onnistunut", detail: error.message, life: 6000 }),
    });

    const items = [
        { label: "Uusi henkilö", icon: "fa-solid fa-circle-plus", command: () => setForm("new") },
        { label: "Muokkaa", icon: "fa-solid fa-pen-to-square", command: () => setForm("edit") },
        {
            label: "Poista", icon: "fa-solid fa-trash", disabled: linked,
            command: () => confirmDialog({
                message: `Haluatko varmasti poistaa henkilön "${person.name}"?`, header: "Varmistus",
                icon: "pi pi-exclamation-triangle", acceptClassName: "p-button-danger", acceptLabel: "Poista", rejectLabel: "Peruuta",
                accept: () => remove(person.id),
            }),
        },
        { label: "Palkinnot", icon: "fa-solid fa-trophy", command: () => setAwardsVisible(true) },
        { label: "Kuva", icon: "fa-solid fa-image", command: () => setImageVisible(true) },
    ];

    const workSaved = (status: boolean, message: string) => {
        onEditWorkClose();
        if (status) {
            refresh();
            toastRef.current?.show({ severity: "success", summary: "Tallentaminen onnistui", life: 4000 });
        } else {
            toastRef.current?.show({ severity: "error", summary: "Tietojen tallentaminen epäonnistui", detail: message, life: 6000 });
        }
    };

    return (
        <>
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
            <SpeedDial model={items} direction="up" className="fixed-dial" showIcon="pi pi-plus" hideIcon="pi pi-times"
                buttonClassName="p-button-primary" />
            <Dialog maximizable blockScroll className="w-full lg:w-6" header="Henkilön tietojen muokkaus"
                visible={form !== null} onHide={() => { setForm(null); refresh(); }}>
                <PersonForm data={form === "edit" ? person : null} onSubmitCallback={() => { setForm(null); refresh(); }} />
            </Dialog>
            <PersonImagePickerDialog person={person} visible={imageVisible} onHide={() => setImageVisible(false)} onSave={refresh} />
            <Dialog maximizable blockScroll closeOnEscape className="w-full lg:w-6" header="Palkintojen muokkaus"
                visible={awardsVisible} onHide={() => { setAwardsVisible(false); refresh(); }}>
                <AwardedForm personId={String(person.id)} onClose={() => { setAwardsVisible(false); refresh(); }} />
            </Dialog>
            <Dialog maximizable blockScroll className="w-full xl:w-6" header="Teoksen muokkaus"
                visible={editWorkId !== null} onHide={onEditWorkClose}>
                {editWorkId !== null && (
                    <Suspense fallback={<div className="flex justify-content-center p-4"><ProgressSpinner style={{ width: "3rem", height: "3rem" }} /></div>}>
                        <WorkForm workId={String(editWorkId)} onSubmitCallback={workSaved} />
                    </Suspense>
                )}
            </Dialog>
        </>
    );
};
