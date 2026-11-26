import { lazy } from "react";

import { PublisherListPage } from "./publisher-list-page";
import { PageVersionSwitch } from "@components/page-version-switch";
import { PUBLISHERS_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const PublisherListNew = lazy(() => import("../list/publisher-list-new").then(m => ({ default: m.PublisherListNew })));

/** /publishers: the current publisher list, or for admins who chose it the new one under trial. */
export const PublisherListSwitch = () => (
    <PageVersionSwitch storageKey={PUBLISHERS_PAGE_VERSION_KEY} pageName="kustantajasivu" current={<PublisherListPage />} next={<PublisherListNew />} />
);

export default PublisherListSwitch;
