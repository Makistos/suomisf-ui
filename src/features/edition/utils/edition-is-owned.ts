import { User } from "@features/user";
import { CombinedEdition, Edition } from "../types";

export const editionIsOwned = (edition: Edition | CombinedEdition, user: User | null) => {
    console.log(edition)
    if (user === null) return false;
    if (edition.owners.find(owner => owner.id === user.id) !== undefined) return true;
    return false;
}
