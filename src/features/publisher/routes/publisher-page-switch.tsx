import { lazy } from "react";

import { PublisherPage } from "./publisher-page";
import { PageVersionSwitch } from "@components/page-version-switch";
import { PUBLISHER_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const PublisherPageNew = lazy(() => import("../page/publisher-page-new").then(m => ({ default: m.PublisherPageNew })));

/** /publishers/:itemId: the current publisher page, or for admins who chose it the new one under trial. */
export const PublisherPageSwitch = () => (
    <PageVersionSwitch storageKey={PUBLISHER_PAGE_VERSION_KEY} pageName="kustantajan sivu" current={<PublisherPage id={null} />} next={<PublisherPageNew />} />
);

export default PublisherPageSwitch;
