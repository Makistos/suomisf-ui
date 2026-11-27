import { MouseEvent, useRef, useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import type { MenuItem } from "primereact/menuitem";

import authHeader from "@services/auth-header";
import { deleteEditionImage } from "@api/edition/delete-edition-image";
import { prepareCoverUpload } from "@utils/prepare-cover-upload";
import { thumbUrl } from "@utils/cover-url";
import { Edition } from "@features/edition";
import { editionLabel } from "../utils/work-facts";

type CoverImage = Edition["images"][number];

/** What a right-click on a cover acts on: the image shown, the printing it belongs to, and where "Lisää kuva" adds one. */
export interface CoverTarget {
    image?: CoverImage;
    /** The printing the image belongs to, for deleting it. */
    imageEdition?: number;
    /** The printing a new cover goes to; none on a merged row, which holds several. */
    addTo?: number;
}

const fullUrl = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.VITE_IMAGE_URL}${src}`);

/**
 * The old work page's cover actions on the new one (owner, #91): the same right-click menu (Lisää kuva and Poista kuva for
 * admins, Kopioi osoite for everyone) on the header cover, the printing rows' thumbnails and the gallery's cover, and a
 * "Kansikuvat" dialog per printing for admins on touch screens and for printings without a cover.
 */
/** workId exactly as the work query's key has it, so a change refreshes the page. */
export const useCoverTools = ({ workId, admin, editions }: { workId: string | number | undefined; admin: boolean; editions: Edition[] }) => {
    const queryClient = useQueryClient();
    const menu = useRef<ContextMenu>(null);
    const file = useRef<HTMLInputElement>(null);
    const toast = useRef<Toast>(null);
    const [target, setTarget] = useState<CoverTarget>({});
    // the printing's id, not the object: after an upload or delete the dialog shows the refreshed covers
    const [dialogId, setDialogId] = useState<number | null>(null);
    const dialogFor = dialogId === null ? null : editions.find(e => e.id === dialogId) ?? null;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["work", workId] });

    const copy = (image: CoverImage) => {
        navigator.clipboard?.writeText(fullUrl(image.image_src));
        toast.current?.show({ severity: "info", summary: "Kuvan osoite kopioitu", life: 2500 });
    };
    const remove = (editionId: number, image: CoverImage) => confirmDialog({
        message: "Poistetaanko kuva?", header: "Poista kuva", icon: "pi pi-exclamation-triangle",
        acceptLabel: "Poista", rejectLabel: "Peruuta", acceptClassName: "p-button-danger",
        accept: async () => {
            const r = await deleteEditionImage(editionId, image.id);
            if (r.status === 200) { toast.current?.show({ severity: "success", summary: "Kuva poistettu" }); refresh(); }
            else toast.current?.show({ severity: "error", summary: "Kuvaa ei poistettu", detail: String(r.response ?? ""), sticky: true });
        },
    });
    const upload = async (editionId: number, files: FileList | null) => {
        for (const f of Array.from(files ?? [])) {
            try {
                // phone photos are large and may not be JPEG
                const prepared = await prepareCoverUpload(f);
                const form = new FormData();
                form.append("file", prepared, prepared.name);
                await axios.post(`${import.meta.env.VITE_API_URL}editions/${editionId}/images`, form, { headers: authHeader() });
                toast.current?.show({ severity: "success", summary: "Kuva lisätty" });
            } catch (err) {
                toast.current?.show({ severity: "error", summary: "Kuvaa ei lisätty", detail: err instanceof Error ? err.message : String(err), sticky: true });
            }
        }
        refresh();
    };
    const pickFile = (editionId: number) => {
        setTarget(t => ({ ...t, addTo: editionId }));
        file.current?.click();
    };

    const items: MenuItem[] = [
        { label: "Lisää kuva", icon: "pi pi-plus", visible: admin && target.addTo !== undefined, command: () => file.current?.click() },
        {
            label: "Poista kuva", icon: "pi pi-trash", visible: admin && !!target.image && target.imageEdition !== undefined,
            command: () => target.image && target.imageEdition !== undefined && remove(target.imageEdition, target.image),
        },
        { label: "Kopioi osoite", icon: "pi pi-copy", visible: !!target.image, command: () => target.image && copy(target.image) },
    ];

    /** onContextMenu for a cover: the old page's menu instead of the browser's. */
    const openMenu = (e: MouseEvent, t: CoverTarget) => {
        if (!t.image && !(admin && t.addTo !== undefined)) return;
        setTarget(t);
        menu.current?.show(e);
    };

    const element = (
        <>
            <Toast ref={toast} />
            {/* above the full-screen gallery */}
            <ContextMenu model={items} ref={menu} autoZIndex baseZIndex={2000} className="wn-covermenu" />
            {admin && (
                <input ref={file} type="file" accept="image/*" multiple hidden data-testid="cover-file"
                    onChange={e => {
                        if (target.addTo !== undefined) upload(target.addTo, e.target.files);
                        e.target.value = "";
                    }} />
            )}
            {admin && (
                <Dialog header={dialogFor ? `Kansikuvat: ${editionLabel(dialogFor)} ${dialogFor.pubyear ?? ""}` : "Kansikuvat"}
                    visible={dialogFor !== null} onHide={() => setDialogId(null)} className="w-full md:w-6" blockScroll>
                    {dialogFor && (
                        <div className="wn-covers-dlg">
                            {(dialogFor.images ?? []).length === 0 && <p>Painoksella ei ole kansikuvaa.</p>}
                            <ul>
                                {(dialogFor.images ?? []).map(img => (
                                    <li key={img.id}>
                                        <img src={thumbUrl(img)} alt={`Kansikuva ${img.id}`} />
                                        <span>
                                            <Button type="button" text size="small" icon="pi pi-copy" label="Kopioi osoite" onClick={() => copy(img)} />
                                            <Button type="button" text size="small" severity="danger" icon="pi pi-trash" label="Poista"
                                                onClick={() => remove(dialogFor.id, img)} />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <Button type="button" icon="pi pi-plus" label="Lisää kuva" onClick={() => pickFile(dialogFor.id)} />
                        </div>
                    )}
                </Dialog>
            )}
        </>
    );
    return { element, openMenu, openDialog: (e: Edition) => setDialogId(e.id) };
};
export type CoverTools = ReturnType<typeof useCoverTools>;
