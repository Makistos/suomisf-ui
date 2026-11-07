import { useQueryClient } from "@tanstack/react-query";
import { ImageType } from "../types/image";
import { ChangeEvent, useRef, useState } from "react";
import { ContextMenu } from "primereact/contextmenu";
import { isAdmin } from "@features/user";
import { getCurrenUser } from "@services/auth-service";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { FileUploadHandlerEvent } from "primereact/fileupload";
import { ConfirmPopup } from "primereact/confirmpopup";
import { coverUrl, thumbUrl } from "./cover-url";

interface ImageViewProps {
    itemId: number | string,
    idx: number,
    //edition: Edition,
    images: ImageType[],
    saveFunc?: (event: FileUploadHandlerEvent) => void | Promise<void>
    deleteFunc: (itemId: string | number, imageId: number) => void,
    onUpload: (event: FileUploadHandlerEvent) => void,
    idxCb: (idx: number) => void,
    editionCount?: number, // Add this to know how many editions are being displayed
    /** Alt text for the cover, e.g. the edition or issue it belongs to. */
    alt?: string,
}

/**
 * Renders an image view component.
 *
 * @param {ImageViewProps} edition - The edition object containing image data.
 * @return {JSX.Element} The rendered image view component.
 */
export const ImageView = ({ itemId, idx, images, saveFunc, deleteFunc, onUpload, idxCb, editionCount, alt }: ImageViewProps) => {
    
    const queryClient = useQueryClient();
    // Before the early return below: images can drop to none and come back
    // (delete the only image, then upload), and hooks must not be skipped.
    const cm = useRef<ContextMenu>(null);
    // Kept in the DOM: iOS Safari doesn't reliably fire change on a
    // detached <input type="file">.
    const fileInput = useRef<HTMLInputElement>(null);
    // The delete button the confirmation popup points at; null = closed.
    const [confirmTarget, setConfirmTarget] = useState<HTMLElement | null>(null);

    if (idx > images.length - 1) {
        idxCb(0);
        idx = 0;
    }
    if (!images || images.length === 0) {
        return null;
    }

    // const imageUploadUrl = () => {
    //     if (images) {
    //         return `editions/${edition.id}/images/${edition.images[idx].id}`;
    //     }
    //     return "";
    // }
    // Use the passed editionCount if available, otherwise fall back to unique edition IDs from images
    const hasOnlyOneEdition = editionCount ? editionCount === 1 : (() => {
        const uniqueEditionIds = [...new Set(images.map(img => img.edition_id))];
        return uniqueEditionIds.length === 1;
    })();

    const admin = isAdmin(getCurrenUser());
    const canAdd = admin && hasOnlyOneEdition;

    const onFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            // Create a FileUploadFile object that matches PrimeReact's interface
            const fileUploadFile = Object.assign(file, {
                objectURL: URL.createObjectURL(file)
            });

            // Create a mock FileUploadHandlerEvent
            const mockEvent: FileUploadHandlerEvent = {
                files: [fileUploadFile],
                options: {
                    clear: () => { },
                    props: {}
                }
            };

            if (saveFunc) {
                saveFunc(mockEvent);
            } else if (onUpload) {
                onUpload(mockEvent);
            }
            queryClient.invalidateQueries();
        }
        // Let the same file be picked again, e.g. after a failed upload.
        target.value = '';
    };

    const deleteCurrent = () => {
        deleteFunc(itemId, images[idx].id);
        queryClient.invalidateQueries();
    };

    const imageItems = [
        {
            label: 'Lisää kuva',
            icon: 'pi pi-plus',
            command: () => fileInput.current?.click(),
            visible: canAdd
        },
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: deleteCurrent,
            visible: admin
        },
        {
            label: 'Kopioi osoite',
            icon: 'pi pi-copy',
            command: () => {
                if (images[idx].image_src.startsWith("http") ||
                    images[idx].image_src.startsWith("https")) {
                    navigator.clipboard.writeText(images[idx].image_src);
                } else {
                    navigator.clipboard.writeText(import.meta.env.VITE_IMAGE_URL + images[idx].image_src);
                }
            }
        }
    ];

    return (
        <div className="coverbox">
            <ContextMenu model={imageItems} ref={cm} />
            {canAdd &&
                <input ref={fileInput} type="file" accept="image/*" hidden
                    onChange={onFileChosen} />
            }
            {/* A cover per edition on the work page: show the thumbnail,
                open the full cover in the preview. */}
            <Image className="pt-2" preview width="150px" src={thumbUrl(images[idx])}
                zoomSrc={coverUrl(images[idx])}
                alt={alt ?? "Kansikuva"}
                onContextMenu={(e) => cm.current?.show(e)}
            />
            {idx > 0 && idx <= images.length - 1 &&
                <Button className="coverbtn btnleft" icon="pi pi-chevron-left"
                    aria-label="Edellinen kansikuva"
                    onClick={() => idxCb(idx - 1)}
                ></Button>
            }
            {idx < images.length - 1 &&
                <Button className="coverbtn btnright" icon="pi pi-chevron-right"
                    aria-label="Seuraava kansikuva"
                    onClick={() => idxCb(idx + 1)}
                ></Button>
            }
            {/* Touch screens have no right-click menu (iOS doesn't open it
                on long press), so admins get the same actions as buttons. */}
            {admin &&
                <div className="cover-touch-actions">
                    {canAdd &&
                        <Button icon="pi pi-plus" text size="small"
                            aria-label="Lisää kuva" tooltip="Lisää kuva"
                            onClick={() => fileInput.current?.click()} />
                    }
                    <Button icon="pi pi-trash" text size="small"
                        severity="danger"
                        aria-label="Poista kuva" tooltip="Poista kuva"
                        onClick={(e) => setConfirmTarget(e.currentTarget)} />
                    <ConfirmPopup target={confirmTarget ?? undefined}
                        visible={confirmTarget !== null}
                        onHide={() => setConfirmTarget(null)}
                        message="Poistetaanko kuva?"
                        acceptLabel="Poista" rejectLabel="Peruuta"
                        accept={deleteCurrent} />
                </div>
            }
        </div>
    )
}
