import { lazy } from "react";

import { PersonPage } from "./person-page";
import { PageVersionSwitch } from "@components/page-version-switch";
import { PERSON_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens it: visitors never download it.
const PersonPageNew = lazy(() => import("../new/person-page-new").then(m => ({ default: m.PersonPageNew })));

/** The /people/:id route: the current person page, or for admins who chose it the new one under trial. */
export const PersonPageSwitch = ({ id }: { id: string | null }) => (
    <PageVersionSwitch storageKey={PERSON_PAGE_VERSION_KEY} pageName="henkilösivu"
        current={<PersonPage id={id} />}
        next={<PersonPageNew id={id} />} />
);
