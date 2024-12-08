import { User } from "@features/user";
import { CombinedEdition, Edition } from "../types";

export const editionIsWishlisted = (edition: Edition | CombinedEdition, user: User | null) => {
    if (edition.id === 5992)
        console.log(edition)
    if (user === null) return false;
    if (edition.wishlisted.find(owner => owner.id === user.id) !== undefined) return true;
    return false;
}
