import { IWork } from './Work';
import { IImage } from './Image';
import { Image } from "primereact/image";
import { IMAGE_URL } from "../systemProps";
import { Tooltip } from 'primereact/tooltip';
//import { EditionString, IEdition } from './Edition';

interface CoverImageListProps {
    works: IWork[]
}

export const CoverImageList = ({ works }: CoverImageListProps) => {

    const imageList = () => {
        let imageDict: Record<string, IImage> = {};
        works.map(work => {
            work.editions.map(edition => {
                edition.images.map(image => {
                    if (!(image.image_src in imageDict)) {
                        imageDict[image.image_src] = image;
                    }
                    return true;
                })
                return true;
            })
            return true;
        })
        return Object.values(imageDict);
    }

    // const workHasImage = (work: IWork, image_src: string) => {
    //     let retval: IEdition[] = [];
    //     work.editions.map(edition => {
    //         edition.images.map(image => {
    //             if (image.image_src === image_src) {
    //                 retval.push(edition);
    //             }
    //             return true;
    //         })
    //         return true;
    //     })
    //     return retval;
    // }

    // const imageTooltip = (image: IImage) => {
    //     let retval = (<div></div>)
    //     works.every(work => {
    //         let editions = workHasImage(work, image.image_src);
    //         if (editions.length > 0) {
    //             retval = (
    //                 <div>
    //                     <b><u>{work.title}</u></b>
    //                     {editions.map(edition => EditionString(edition)).join('<br>')}
    //                 </div>
    //             )
    //             return false;
    //         }
    //         return true;
    //     })
    //     return retval;
    // }

    return (
        <div>
            {
                imageList().map((image: IImage) => {
                    return (
                        <>
                            <Tooltip target={".image-" + image.id}>
                                {/*imageTooltip(image)*/}
                                testing
                            </Tooltip>
                            <Image className="p-1" preview width="100px"
                                imageClassName={".image-" + image.id}
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