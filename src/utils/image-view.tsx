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
    deleteFunc: (itemId: string | number, imageId: number) => void,
    idxCb: (idx: number) => void
}

/**
 * Renders an image view component.
 *
 * @param {ImageViewProps} edition - The edition object containing image data.
 * @return {JSX.Element} The rendered image view component.
 */
export const ImageView = ({ itemId, idx, images, deleteFunc, idxCb }: ImageViewProps) => {
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
    const imageItems = [
        {
            label: 'Poista kuva',
            icon: 'pi pi-trash',
            command: () => {
                deleteFunc(itemId, images[idx].id);
                queryClient.invalidateQueries();
            },
            visible: isAdmin(getCurrenUser()) && images.length === 1
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
