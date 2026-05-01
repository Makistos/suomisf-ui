import { SfTag } from "../types";

/**
 * Determines the severity based on the tag type ID.
 *
 * This will set the severity of the tag based on the tag type which in turn
 * sets the color of the tag.
 *
 * @param {SfTag} tag - The tag to evaluate.
 * @return {string} The severity level based on the tag type.
 */
export const tagTypeToSeverity = (tag: SfTag) => {
    if (tag.type?.id === 2) {
        // Subgenre
        return "danger";
    }
    if (tag.type?.id === 3) {
        // Style
        return "warning";
    }
    if (tag.type?.id === 4) {
        // Actor
        return "success";
    }
    if (tag.type?.id === 5) {
        // Location
        return "info";
    }

    // For all other types
    return undefined;
}

export const tagTypeToClass = (tag: SfTag) => {
    if (tag.type?.id === 6) {
        // Era
        return "tag-era";
    }
    if (tag.type?.id === 7) {
        // List
        return "tag-list";
    }
    return undefined;
}

export const tagTypeIcon = (tag: SfTag) => {
    if (tag.type?.id === 2) {
        // Subgenre
        return "pi pi-bookmark";
    }
    if (tag.type?.id === 3) {
        // Style
        return "pi pi-palette";
    }
    if (tag.type?.id === 4) {
        // Actor
        return "pi pi-user";
    }
    if (tag.type?.id === 5) {
        // Location
        return "pi pi-map";
    }
    if (tag.type?.id === 6) {
        // Era
        return "pi pi-clock";
    }
    if (tag.type?.id === 7) {
        // List
        return "pi pi-list";
    }

    // For all other types
    return undefined;
}