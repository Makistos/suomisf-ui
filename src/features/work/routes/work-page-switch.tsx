import { lazy } from "react";

import { WorkPage } from "./work-page";
import { PageVersionSwitch } from "@components/page-version-switch";
import { WORK_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const WorkPageNew = lazy(() => import("../new/work-page-new").then(m => ({ default: m.WorkPageNew })));

/** The /works/:id and /editions/:id routes: the current work page, or for admins who chose it the new one under trial. */
export const WorkPageSwitch = () => (
    <PageVersionSwitch storageKey={WORK_PAGE_VERSION_KEY} pageName="teossivu"
        current={<WorkPage />}
        next={<WorkPageNew />} />
);
