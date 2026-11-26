import { lazy } from "react";

import { WorkSearchPage } from "./work-search";
import { PageVersionSwitch } from "@components/page-version-switch";
import { BOOKINDEX_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const BookIndexNew = lazy(() => import("../bookindex/book-index-new").then(m => ({ default: m.BookIndexNew })));

/** /bookindex: the current book index, or for admins who chose it the new one under trial. */
export const BookIndexSwitch = () => (
    <PageVersionSwitch storageKey={BOOKINDEX_PAGE_VERSION_KEY} pageName="kirjasivu" current={<WorkSearchPage />} next={<BookIndexNew />} />
);

export default BookIndexSwitch;
