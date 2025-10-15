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
            name: item.person['name'],
            alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
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
            <div className="grid">
                {work.contributions.filter(person => person.role.id === 1).length > 0 && (
                    <div className="grid col-12 mb-0 pb-0">
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
                        <div className="grid col-12">
                            <h2 className="mb-0 mt-0 font-semibold">
                                Toim.&nbsp;
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={work.contributions.filter(
                                        contrib => contrib.role.id === 3).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['name'],
                                            alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                        }))} />
                            </h2>
                        </div>
                    )}
                <div className="grid col-12 pt-0 mt-3 mb-2 pb-0">
                    <h1 className="mt-0 mb-0 text-2xl sm:text-3xl lg:text-4xl uppercase"
                        style={{ lineHeight: '1.0' }}>
                        {work.title}<br />
                        {work.subtitle && (
                            <span className="text-base sm:text-lg pt-0 mt-0">{work.subtitle}</span>
                        )}
                    </h1>
                </div>
                <div className="grid col-12 mt-0 pt-0 p-2">
                    <p className="font-medium text-sm mt-0">
                        {original(work)}
                    </p>

                    {work.bookseries && (
                        <div className="col-12 p-0">
                            <WorkBookseriesBrowser workId={work.id} bookseriesId={work.bookseries.id} />
                        </div>
                    )}
                    {work.consists_of && work.consists_of.length > 0 && (
                        <div className="col-12 p-0 mt-2">
                            <b>Koostuu teoksista:</b>
                            <ul className="mt-0 mb-2">
                                {work.consists_of.map((subwork) => (
                                    <li key={subwork.id}>
                                        <Link to={`/works/${subwork.id}`}>
                                            {subwork.title}
                                            {(subwork.orig_title && subwork.language_name?.id !== 7) || subwork.pubyear ? (
                                                ` (${[
                                                    subwork.orig_title && subwork.language_name?.id !== 7 ? subwork.orig_title : null,
                                                    subwork.pubyear
                                                ].filter(Boolean).join(', ')})`
                                            ) : ''}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {work.part_of && work.part_of.length > 0 && (
                        <div className="col-12 p-0 mt-2">
                            {work.part_of.length === 1 && <b>Osa teosta:</b>}
                            {work.part_of.length > 1 && <b>Osa teoksia:</b>}
                            <ul className="mt-0 mt-2 mb-2">
                                {work.part_of.map((parentwork) => (
                                    <li key={parentwork.id}>
                                        <Link to={`/works/${parentwork.id}`}>
                                            {parentwork.title}
                                            {(parentwork.orig_title && parentwork.language_name?.id !== 7) || parentwork.pubyear ? (
                                                ` (${[
                                                    parentwork.orig_title && parentwork.language_name?.id !== 7 ? parentwork.orig_title : null,
                                                    parentwork.pubyear
                                                ].filter(Boolean).join(', ')})`
                                            ) : ''}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {work.editions && work.editions.length > 0 && (
                        <div className="col-12 p-0">
                            <div className="col-12 p-0">
                                {work.misc}
                            </div>
                            {work.description && (
                                <div className="grid flex-wrap col-12 pb-0 mb-0 p-0">
                                    <div dangerouslySetInnerHTML={{ __html: work.description }} />
                                    {work.descr_attr && (
                                        <div className="book-attribution"
                                            dangerouslySetInnerHTML={{ __html: work.descr_attr }} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
