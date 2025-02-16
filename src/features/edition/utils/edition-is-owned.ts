import { User } from "@features/user";
import { CombinedEdition, Edition } from "../types";

export const editionIsOwned = (edition: Edition | CombinedEdition, user: User | null) => {
    let retval = false
    if (user === null) return false;
    if (!edition.owners) return false;
    if (edition.owners.some(owner => owner.id === user.id)) retval = true;
    return retval;
}
