import { lazy } from "react";

import { ShortPage } from "./short-page";
import { PageVersionSwitch } from "@components/page-version-switch";
import { SHORT_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const ShortPageNew = lazy(() => import("../new/short-page-new").then(m => ({ default: m.ShortPageNew })));

/** /shorts/:id: the current short story page, or for admins who chose it the new one under trial. */
export const ShortPageSwitch = () => (
    <PageVersionSwitch storageKey={SHORT_PAGE_VERSION_KEY} pageName="novellisivu"
        current={<ShortPage id={null} />}
        next={<ShortPageNew />} />
);
