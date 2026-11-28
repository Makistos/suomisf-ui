import { lazy } from "react";

import { WorksByType } from "./works-by-type";
import { PageVersionSwitch } from "@components/page-version-switch";
import { NONFICTION_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const BookIndexNew = lazy(() => import("../bookindex/book-index-new").then(m => ({ default: m.BookIndexNew })));

/** /nonfiction: the current list of every non-fiction book, or for admins who chose it the new paged book index for non-fiction. */
export const NonfictionSwitch = () => (
    <PageVersionSwitch storageKey={NONFICTION_PAGE_VERSION_KEY} pageName="tietokirjasivu" current={<WorksByType worktype="4" />}
        next={<BookIndexNew kind="tietokirjat" />} />
);

export default NonfictionSwitch;
