import { lazy } from "react";

import { SFTags } from "./sftags-page";
import { SFTag } from "./sftag";
import { PageVersionSwitch } from "@components/page-version-switch";
import { TAG_PAGE_VERSION_KEY, TAGS_PAGE_VERSION_KEY } from "@utils/page-version";

// Loaded only when an admin opens them: visitors never download them.
const TagsPageNew = lazy(() => import("../new/tags-page-new").then(m => ({ default: m.TagsPageNew })));
const TagPageNew = lazy(() => import("../new/tag-page-new").then(m => ({ default: m.TagPageNew })));

/** /tags: the current tag list, or for admins who chose it the new one under trial. */
export const TagsPageSwitch = () => (
    <PageVersionSwitch storageKey={TAGS_PAGE_VERSION_KEY} pageName="asiasanasivu" current={<SFTags />} next={<TagsPageNew />} />
);

/** /tags/:id: the current tag page, or for admins who chose it the new one under trial. */
export const TagPageSwitch = () => (
    <PageVersionSwitch storageKey={TAG_PAGE_VERSION_KEY} pageName="asiasanan sivu" current={<SFTag id={null} />} next={<TagPageNew />} />
);
