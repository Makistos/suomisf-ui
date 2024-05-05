import { User } from "@features/user";
import { Work, WorkFormData } from "@features/work";
import { getApiContent } from "@services/user-service";
import { Contribution } from "types/contribution";
import { emptyContributor } from "components/forms/contributor-field";

const convToForm = (work: Work): WorkFormData => ({
    id: work.id,
    title: work.title,
    subtitle: work.subtitle ? work.subtitle : '',
    orig_title: work.orig_title ? work.orig_title : '',
    pubyear: work.pubyear,
    language: work.language_name,
    genres: work.genres,
    tags: work.tags,
    description: work.description ? work.description : '',
    descr_attr: work.descr_attr,
    misc: work.misc ? work.misc : '',
    bookseries: work.bookseries,
    bookseriesnum: work.bookseriesnum,
    bookseriesorder: work.bookseriesorder,
    contributions: [],
    work_type: work.work_type,
    links: work.links.length > 0 ? work.links : [{ link: '', description: '' }]
});

const defaultValues: WorkFormData = {
    id: null,
    title: '',
    subtitle: '',
    orig_title: '',
    pubyear: null,
    language: null,
    genres: [],
    tags: [],
    description: '',
    descr_attr: '',
    misc: '',
    bookseries: null,
    bookseriesnum: '',
    bookseriesorder: null,
    contributions: [emptyContributor],
    work_type: null,
    links: [{ link: '', description: '' }]
}

export const getWorkFormData = async (id: string | null, user: User | null) => {
    if (id === null) {
        return defaultValues;
    }
    const work: Work = await getApiContent(`works/${id}`, user).then((response) => response.data);
    let contributors: Contribution[] = [];
    if (work) {
        contributors = work.contributions.filter((contribution: Contribution, index: number, arr: Contribution[]) => arr.indexOf(contribution) === index);
    }
    if (contributors.length === 0) {
        contributors = [emptyContributor];
    }
    let retval = convToForm(work);
    retval.contributions = contributors;
    return retval;
}