import { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Galleria } from "primereact/galleria";
import { Image } from "primereact/image";

interface ImageGalleryProps {
    /**
     * Array of image URLs to display (for backward compatibility)
     */
    images?: string[];
    /**
     * Array of image objects with metadata
     */
    imageData?: { url: string; version?: number; editionnum?: number }[];
    /**
     * Alt text for the images
     */
    alt?: string;
    /**
     * Height of the main image
     */
    height?: string;
    /**
     * CSS classes for the main image
     */
    className?: string;
    /**
     * CSS classes for the image element
     */
    imageClassName?: string;
    /**
     * Whether to show preview on click for single images
     */
    preview?: boolean;
    /**
     * Custom click handler for the image
     */
    onClick?: () => void;
    /**
     * Whether to show the gallery button for multiple images
     */
    showGalleryButton?: boolean;
}

export const ImageGallery = ({
    images,
    imageData,
    alt = "Image",
    height = "150",
    className = "",
    imageClassName = "",
    preview = true,
    onClick,
    showGalleryButton = true
}: ImageGalleryProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [galleryVisible, setGalleryVisible] = useState(false);

    // Use imageData if provided, otherwise fall back to images for backward compatibility
    const imageList = imageData || (images ? images.map(url => ({ url })) : []);

    if (!imageList || imageList.length === 0) {
        return null;
    }

    const currentImage = currentIndex >= 0 ? imageList[currentIndex] : imageList[0];
    const hasMultipleImages = imageList.length > 1;

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    // Format version and edition info for display
    const formatImageCounter = (index: number): string => {
        const item = imageList[index];
        if ('version' in item && 'editionnum' in item && (item.version || item.editionnum)) {
            let result = "";
            if (item.version) {
                result += `${item.version}. laitos`;
            }
            if (item.editionnum) {
                if (result) result += ", ";
                result += `${item.editionnum}. painos`;
            } else {
                result = ""; // Reset result if no editionnum
            }
            return result;
        }
        return ""; // Return empty string if no version or edition data
    };

    // Format compact version for the small counter overlay
    const formatCompactCounter = (index: number): string => {
        const item = imageList[index];
        if ('version' in item && 'editionnum' in item && (item.version || item.editionnum)) {
            let result = "";
            if (item.version) {
                result += `${item.version}l`;
            }
            if (item.editionnum) {
                result += `${item.editionnum}p`;
            }
            return result;
        }
        return ""; // Return empty string if no version or edition data
    };

    const galleryItems = imageList.map((item, index) => ({
        itemImageSrc: item.url,
        thumbnailImageSrc: item.url,
        alt: `${alt} ${index + 1}`,
        title: formatImageCounter(index)
    }));

    const itemTemplate = (item: any) => {
        return (
            <div className="text-center">
                <img
                    src={item.itemImageSrc}
                    alt={item.alt}
                    style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                />
                {item.title && (
                    <div className="mt-2 text-sm text-600">
                        {item.title}
                    </div>
                )}
            </div>
        );
    };

    const thumbnailTemplate = (item: any) => {
        return (
            <img
                src={item.thumbnailImageSrc}
                alt={item.alt}
                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
        );
    };

    return (
        <div className="relative text-right">
            <div className="relative inline-block">
                <div
                    className={onClick ? "cursor-pointer" : ""}
                    onClick={onClick}
                >
                    <Image
                        src={currentImage.url}
                        alt={alt}
                        height={height}
                        className={className}
                        imageClassName={imageClassName}
                        preview={!hasMultipleImages && preview && !onClick}
                    />
                </div>

                {hasMultipleImages && (
                    <>
                        {/* Image counter - moved to top right */}
                        {/* <div className="absolute top-1 right-1 bg-black-alpha-70 text-white text-xs px-2 py-1 border-round">
                            {currentIndex >= 0 ? formatCompactCounter(currentIndex) : formatCompactCounter(0)}
                        </div> */}
                    </>
                )}
            </div>

            {/* Button area - always present to maintain consistent spacing */}
            <div className="text-right mt-2" style={{ minHeight: '32px' }}>
                {hasMultipleImages && (
                    <>
                        {/* Navigation arrows */}
                        <Button
                            icon="pi pi-chevron-left"
                            className="p-button-rounded p-button-sm bg-black-alpha-50 hover:bg-black-alpha-70"
                            onClick={prevImage}
                        />
                        <Button
                            icon="pi pi-chevron-right"
                            className="p-button-rounded p-button-sm bg-black-alpha-50 hover:bg-black-alpha-70"
                            onClick={nextImage}
                        />

                        {showGalleryButton && (
                            <Button
                                icon="pi pi-images"
                                tooltip="Galleria"
                                className="p-button-rounded p-button-sm bg-black-alpha-50 hover:bg-black-alpha-70 ml-2"
                                onClick={() => {
                                    setCurrentIndex(-1); // Reset to show thumbnails first
                                    setGalleryVisible(true);
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Gallery Dialog */}
            {hasMultipleImages && (
                <Dialog
                    visible={galleryVisible}
                    onHide={() => {
                        setGalleryVisible(false);
                        setCurrentIndex(0); // Reset to first image when closing
                    }}
                    header="Kuvagalleria"
                    modal
                    maximizable
                    style={{ width: '70vw', height: '70vh' }}
                    contentStyle={{ padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    {/* Show thumbnail grid initially */}
                    {currentIndex === -1 ? (
                        <div className="grid p-4 justify-content-center" style={{ maxWidth: '100%', width: '100%' }}>
                            {imageList.map((item, index) => (
                                <div className="col-3 mb-3" key={index}>
                                    <div className="text-center cursor-pointer" onClick={() => setCurrentIndex(index)}>
                                        <img
                                            src={item.url}
                                            alt={`${alt} ${index + 1}`}
                                            style={{ width: '100%', maxHeight: '250px', objectFit: 'contain' }}
                                            className="border-round hover:opacity-80 transition-all transition-duration-200"
                                        />
                                        <div className="mt-2 text-sm text-600">
                                            {formatImageCounter(index)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Show full gallery when image is selected */
                        <div>
                            <Button
                                icon="pi pi-arrow-left"
                                label="Takaisin"
                                className="p-button-text mb-2"
                                onClick={() => setCurrentIndex(-1)}
                            />
                            <Galleria
                                value={galleryItems}
                                activeIndex={currentIndex}
                                onItemChange={(e) => setCurrentIndex(e.index)}
                                item={itemTemplate}
                                thumbnail={thumbnailTemplate}
                                numVisible={5}
                                showThumbnails
                                showIndicators
                                showItemNavigators
                                showItemNavigatorsOnHover
                                circular
                                autoPlay={false}
                                transitionInterval={0}
                            />
                        </div>
                    )}
                </Dialog>
            )}
        </div>
    );
};
