import { Work } from '../features/work';
import { IImage } from './Image';
import { Image } from "primereact/image";
import { IMAGE_URL } from "../systemProps";
import { Tooltip } from 'primereact/tooltip';
import { EditionString } from "../features/edition/utils/edition-string";
import { Edition } from "../features/edition/types";

interface CoverImageListProps {
    works?: Work[],
    editions?: Edition[]
}

export const CoverImageList = ({ works, editions }: CoverImageListProps) => {

    const updateImageDict = (editions: Edition[]) => {
        let retval: Record<string, IImage> = {};
        editions.every(edition => {
            if (edition.images !== undefined) {
                edition.images.map(image => {
                    if (!(image.image_src in retval)) {
                        retval[image.image_src] = image;
                    }
                    return true;
                })
            }
            return true;
        })

        return retval;
    }

    const imageList = () => {
        // Create a list of images on the page where duplicate images
        // are removed.
        let imageDict: Record<string, IImage> = {};
        if (editions) {
            imageDict = updateImageDict(editions);
        }
        else if (works) {
            works.map(work => {
                imageDict = { ...imageDict, ...updateImageDict(work.editions) };
                return true;
            })
        }
        return Object.values(imageDict);
    }

    const imageTooltip = (image: IImage) => {
        let retval = (<div></div>);

        const hasImage = (editions: Edition[], image_src: string) => {
            let retval: Edition[] = [];
            if (editions) {
                editions.map(edition => {
                    edition.images.map(image => {
                        if (image.image_src === image_src) {
                            retval.push(edition);
                        }
                        return true;
                    })
                    return true;
                })
            }
            return retval;
        }

        const toolTipText = (title: string, editions: Edition[]) => {
            if (editions.length > 0) {
                retval = (
                    <div>
                        <b><u>{title}</u></b><br></br>
                        {editions.map(edition => (
                            <div>{EditionString(edition)} ({edition.pubyear})</div>
                        ))}
                    </div>
                )
            }
            return retval;

        }

        if (editions) {
            const image_editions = hasImage(editions, image.image_src);
            retval = toolTipText(image_editions[0].title, image_editions);
        }
        if (works) {
            works.every(work => {
                const image_editions = hasImage(work.editions, image.image_src);
                if (image_editions.length > 0) {
                    retval = toolTipText(work.title, image_editions);
                    return false;
                }
                return true;
            })
        }
        return retval;
    }

    return (
        <div>
            {
                imageList().map((image: IImage) => {
                    return (
                        <>
                            <Tooltip>
                                {imageTooltip(image)}
                            </Tooltip>
                            <Image preview className={"p-1 image-" + image.id} width="150px"
                                src={IMAGE_URL + image.image_src}
                                key={".image-" + image.id}
                            />
                        </>
                    )
                })
            }
        </div>
    )
}