import { User } from "@features/user";
import { CombinedEdition, Edition } from "../types";

export const editionIsWishlisted = (edition: Edition | CombinedEdition, user: User | null) => {
    if (user === null) return false;
    if (edition.wishlisted.find(owner => Number(owner.id) === Number(user.id)) !== undefined) return true;
    return false;
}
