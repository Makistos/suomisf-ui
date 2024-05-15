import { SfTag } from "../types";

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