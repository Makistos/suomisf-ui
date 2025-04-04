import { Publisher } from "../../publisher/types";
import { Person } from "../../person/types";
import { Work } from "../../work";
import { ImageType } from "../../../types/image";
import { EditionFormat } from "../../../types/edition-format";
import { Binding } from "../../../types/binding";
import { Pubseries } from "../../pubseries/types";
import { Contribution } from "../../../types/contribution";
import { User } from "@features/user";

export interface ISBN {
    isbn: string;
    binding: Binding;
}

export interface Edition {
    binding: Binding;
    coll_info: string;
    contributions: Contribution[];
    coverimage: number;
    dustcover: number;
    editionnum: number | string;
    editors: Person[];
    format: EditionFormat;
    id: number;
    images: ImageType[];
    imported_string: string;
    isbn: string | ISBN[];
    misc: string;
    pages?: number;
    printedin?: string;
    publisher: Publisher;
    pubseries: Pubseries | null;
    pubseriesnum?: number;
    pubyear: number | string;
    size?: number;
    subtitle: string;
    title: string;
    translators: Person[];
    verified: Boolean;
    version: number;
    work: Work[];
    combined: boolean;
    owners: User[];
    wishlisted: User[];
}

export interface CombinedEdition {
    binding: Binding;
    coll_info: string;
    contributions: Contribution[];
    coverimage: number;
    dustcover: number;
    editionnum: number | string;
    editors: Person[];
    format: EditionFormat;
    id: number;
    images: ImageType[];
    imported_string: string;
    isbn: string;
    misc: string;
    pages?: number;
    printedin?: string;
    publisher: Publisher;
    pubseries: Pubseries;
    pubseriesnum?: number;
    pubyear: number | string;
    size?: number;
    subtitle: string;
    title: string;
    translators: Person[];
    verified: Boolean;
    version: number;
    work: Work[];
    owners: User[]
    wishlisted: User[];
    combined: boolean;
}

export interface EditionProps {
    edition: Edition | CombinedEdition,
    showFirst?: boolean,
    details?: string,
    person?: string,
    showPerson?: boolean,
    work: Work,
    card?: boolean,
    showVersion?: boolean
    contributions?: Contribution[],
    detailDepth?: number,
    isOwned?: boolean,
    isWishlisted?: boolean
}

export interface EditionFormData {
    [index: string]: any,
    id: number | null,
    title: string,
    subtitle: string,
    editionnum?: number | null,
    version?: number | null,
    pubyear?: number | null,
    pages?: number | null,
    size?: number | null,
    misc: string,
    imported_string: string,
    isbn: string,
    printedin?: string,
    coll_info: string,
    contributors: Contribution[],
    dustcover?: boolean | null,
    coverimage?: boolean | null,
    format: EditionFormat | null,
    binding: Binding,
    pubseries?: Pubseries | null,
    pubseriesnum?: number | null,
    publisher: Publisher | null,
    verified: Boolean | null

}

export interface EditionCondition {
    [index: string]: any,
    id: number,
    name: string,
    value: number
}

export interface EditionOwnershipStatus {
    [index: string]: any,
    edition_id: number,
    user_id: number | null,
    condition: EditionCondition | null | undefined,
    description: string | null
}

export interface OwnedBook {
    [index: string]: any,
    book: Edition,
    user: User,
    condition: EditionOwnershipStatus
}

export interface EditionWishlistStatus {
    edition_id: number,
    user_id: number
}