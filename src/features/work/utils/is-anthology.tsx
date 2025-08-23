import { Work } from "../types";


/**
 * Checks if a work is an anthology.
 *
 * @param work - The work to be checked.
 * @return {boolean} Returns true if the work is an anthology, otherwise false.
 */
export const isAnthology = (work: Work) => {
    // Check if work is a collection with multiple authors
    // This is the definition of an anthology
    if (work.stories === undefined || work.stories.length === 0) {
        return false; // Not even a collection
    }

    // Create a set of author names from the stories
    const authors = new Set(
        work.stories
            .map(story =>
                story.contributors
                    .filter(contribution => contribution.role.name === 'Kirjoittaja')
            )
    );

    return authors.size > 1; // If there are more than one author, it's an anthology
};
