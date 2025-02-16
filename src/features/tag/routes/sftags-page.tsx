import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ProgressSpinner } from 'primereact/progressspinner';

import { getCurrenUser } from '@services/auth-service';
import { SfTag } from "@features/tag/types";
import { useDocumentTitle } from '@components/document-title';
import { getTags } from '@api/tag/get-tags';
import { useQuery } from '@tanstack/react-query';

export const SFTags = () => {
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    useEffect(() => {
        setDocumentTitle("Asiasanat");
    }, [])

    // const [loading, setLoading] = useState(false);
    const user = useMemo(() => { return getCurrenUser() }, []);

    const { isLoading, data } = useQuery({
        queryKey: ['tags'],
        queryFn: () => getTags(user)
    })

    if (isLoading) {
        return <ProgressSpinner />
    }

    const tagCount = (tag: SfTag) => {
        let count = 0;
        if (tag.articlecount) {
            count += tag.articlecount;
        }
        if (tag.storycount) {
            count += tag.storycount;
        }
        if (tag.workcount) {
            count += tag.workcount
        }
        return count;
    }

    const renderTags = (tags: SfTag[]) => {
        return tags.map((tag: SfTag) => {
            return (
                <>
                    <Link to={`/tags/${tag.id}`} key={tag.id}>{tag.name}</Link>&nbsp;
                    ({tagCount(tag)})
                    < br />
                </>
            )
        })
    }

    return (
        <main>
            {
                (data === null || data === undefined) || isLoading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    :
                    (
                        <div className="grid justify-content-center">
                            <div className="grid col-12 justify-content-center">
                                <h1 className="maintitle">Asiasanat</h1>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Alagenret</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type?.name === 'Alagenre'))}
                                </div>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Tyylit</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type?.name === 'Tyyli'))}
                                </div>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Paikat</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type?.name === 'Paikka'))}
                                </div>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Toimijat</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type?.name === 'Toimija'))}
                                </div>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Tapahtuma-aika</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type?.name === 'Aika'))}
                                </div>
                            </div>
                            <div className="grid col-12 mb-3">
                                <h2>Aihe</h2>
                                <div className="three-column">
                                    {renderTags(data.filter(tag => tag.type === null || tag.type?.name === 'Aihe'))}
                                </div>
                            </div>
                        </div>
                    )
            }
        </main>
    )
}