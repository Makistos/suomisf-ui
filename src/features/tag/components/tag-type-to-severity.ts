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
        // Location
        return "success";
    }
    if (tag.type?.id === 5) {
        // Actor
        return "info";
    }
    if (tag.type?.id === 6) {
        // Era - this looks exactly like primary but there are no more
        // different looking tags to choose from
        return undefined;
    }

    // For all other types
    return undefined;
}