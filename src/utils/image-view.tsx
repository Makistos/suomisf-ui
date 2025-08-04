import { useQueryClient } from "@tanstack/react-query";
import { ImageType } from "../types/image";
import { useMemo, useRef } from "react";
import { ContextMenu } from "primereact/contextmenu";
import { isAdmin } from "@features/user";
import { getCurrenUser } from "@services/auth-service";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";

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
}

/**
 * Renders an image view component.
 *
 * @param {ImageViewProps} edition - The edition object containing image data.
 * @return {JSX.Element} The rendered image view component.
 */
export const ImageView = ({ itemId, idx, images, saveFunc, deleteFunc, onUpload, idxCb, editionCount, ...rest }: ImageViewProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const queryClient = useQueryClient();

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
    const cm = useRef<ContextMenu>(null);

    // Use the passed editionCount if available, otherwise fall back to unique edition IDs from images
    const hasOnlyOneEdition = editionCount ? editionCount === 1 : (() => {
        const uniqueEditionIds = [...new Set(images.map(img => img.edition_id))];
        return uniqueEditionIds.length === 1;
    })();

    const imageItems = [
        {
            label: 'Lisää kuva',
            icon: 'pi pi-plus',
            command: () => {
                // Create a temporary file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
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
                };
                input.click();
            },
            visible: isAdmin(getCurrenUser()) && hasOnlyOneEdition
        },
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: () => {
                console.log("ImageView: delete image", images);
                deleteFunc(itemId, images[idx].id);
                queryClient.invalidateQueries();
            },
            visible: isAdmin(getCurrenUser())
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
            <Image className="pt-2" preview width="150px" src={import.meta.env.VITE_IMAGE_URL + images[idx].image_src}
                onContextMenu={(e) => cm.current?.show(e)}
            />
            {idx > 0 && idx <= images.length - 1 &&
                <Button className="coverbtn btnleft" icon="pi pi-chevron-left"
                    onClick={() => idxCb(idx - 1)}
                ></Button>
            }
            {idx < images.length - 1 &&
                <Button className="coverbtn btnright" icon="pi pi-chevron-right"
                    onClick={() => idxCb(idx + 1)}
                ></Button>
            }
        </div>
    )
}
