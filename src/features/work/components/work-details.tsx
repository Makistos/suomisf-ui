import React from 'react';
import { Link } from "react-router-dom";
import _ from "lodash"

import { GenreGroup } from "../../genre";
import { TagGroup } from "../../tag";
import { LinkList } from "../../../components/link-list";
import { AwardPanel } from "../../award";
import { LinkPanel } from "../../../components/link-panel";
import { WorkProps } from "../routes";
import { Contribution } from '../../../types/contribution';
import WorkBookseriesBrowser from './work-bookseries-browser';
import { isForeign } from '../utils/is-foreign';
import { Work } from '../types';

export const WorkDetails = ({ work }: WorkProps) => {

    const compareContribs = (a: Contribution, b: Contribution) => {
        if (a.person.id !== b.person.id) return false;
        if (a.role.id !== b.role.id) return false;
        return true;
    }
    const authors = (contributions: Contribution[]) => {
        const uniques = _.uniqWith(contributions, compareContribs);
        return uniques.filter(person => person.role.id === 1).map((item) => ({
            id: item.person['id'],
            name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
        }))
    }

    const original = (work: Work) => {
        let retval = '';
        if (isForeign(work)) {
            retval = work.orig_title + ", "
        }
        retval += work.pubyear
        if (work.language_name) {
            retval += " (" + work.language_name.name + ")"
        }
        return retval
    }
    return (
        <>
            <div className="grid align-items-center justify-content-center">
                {work.contributions.filter(person => person.role.id === 1).length > 0 && (
                    <div className="grid col-12 justify-content-center">
                        <h2 className="mb-0 font-semibold">
                            <LinkList path="people"
                                separator=" &amp; "
                                items={authors(work.contributions)} />
                        </h2>
                    </div>
                )}
                {work.contributions &&
                    work.contributions.filter(person => person.role.id === 1).length === 0 &&
                    work.contributions.filter(person => person.role.id === 3).length > 0 && (
                        <div className="grid col-12 justify-content-center">
                            <h2 className="mb-0 mt-0">
                                Toim.&nbsp;
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={work.contributions.filter(
                                        contrib => contrib.role.id === 3).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']

                                        }))} />
                            </h2>
                        </div>
                    )}
                <div className="grid col-12 justify-content-center">
                    <h1 className="mt-1 mb-0">{work.title}</h1>
                </div>
                <div className="grid col-12 justify-content-center">
                    <h2 className="mt-1 mb-0">{work.subtitle}</h2>
                </div>
                <div className="grid col-12 justify-content-center">
                    {work.contributions &&
                        work.contributions.filter(person => person.role.id === 1).length !== 0 &&
                        work.contributions.filter(person => person.role.id === 3).length > 0
                        && (
                            <div className="grid col-12 justify-content-center">
                                <h3 className="mb-0 mt-0">
                                    Toim.&nbsp;
                                    <LinkList path="people"
                                        separator=" &amp; "
                                        items={work.contributions.filter(contrib => contrib.role.id === 3).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']

                                        }))} />
                                </h3>
                            </div>
                        )}
                    <p className="mt-1">
                        {original(work)}
                    </p>

                    <div className="col-12">
                        <GenreGroup genres={work.genres} />
                    </div>
                    <div className="grid col-12 justify-content-center">
                        <div className="grid col-6 p-3 justify-content-end">
                            <AwardPanel awards={work.awards}></AwardPanel>
                        </div>
                        <div className="grid col-6 p-3 justify-content-start">
                            <LinkPanel links={work.links} />
                        </div>
                    </div>
                    {work.bookseries && (
                        <div className="col-12">
                            <WorkBookseriesBrowser workId={work.id} bookseriesId={work.bookseries.id} />
                        </div>
                    )}
                    <div className="col-12">
                        {work.misc}
                    </div>
                    {work.description && (
                        <div className="col-12">
                            <div dangerouslySetInnerHTML={{ __html: work.description }} />
                        </div>
                    )}
                    <div className="grid col-12 justify-content-start">
                        <TagGroup tags={work.tags} overflow={10} showOneCount={false}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};
