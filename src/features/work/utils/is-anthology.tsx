import { Work } from "../types";


export const isAnthology = (work: Work) => {
    // Check if work is a collection with multiple
    // authors. This is the definition of anthology.
    if (work.stories.length === 0) {
        // Not even a collection
        return false;
    }
    // Create a dictionary with the authors' names
    // as key. If our dictionary has more than one
    // value it's an anthology.
    let authors: Record<string, any> = {};
    work.stories.map(story => {
        const author_name: string = story.contributors.filter(contribution => contribution.role.name === 'author')
            .sort((a, b) => a.person.name > b.person.name ? -1 : 1)
            .map(author => author.person.name).toString();
        if (!(author_name in authors)) {
            authors[author_name] = author_name;
        }
        return true;
    });
    if (Object.keys(authors).length > 1) {
        return true;
    }
    return false;
};
