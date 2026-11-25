import { lazy } from "react";

import HomeAlt from "../../home-alt";
import { PageVersionSwitch } from "@components/page-version-switch";
import { FRONT_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const FrontPageNew = lazy(() => import("./new/front-page-new").then(m => ({ default: m.FrontPageNew })));

/** The front page: the current one, or for admins who chose it the new one under trial. */
export const FrontPageSwitch = () => (
    <PageVersionSwitch storageKey={FRONT_PAGE_VERSION_KEY} pageName="etusivu" current={<HomeAlt />} next={<FrontPageNew />} />
);

export default FrontPageSwitch;
