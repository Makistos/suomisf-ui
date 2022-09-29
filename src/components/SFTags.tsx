import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
import { ProgressSpinner } from 'primereact/progressspinner';

import { ITag } from "./SFTag";

interface TagProps {
    id?: number | null,
    tag?: string,
    count?: number | null
}
export const SFTags = ({ id }: TagProps) => {
    const [genreTags, setGenreTags]: [ITag[], (tag: ITag[]) => void] = useState<ITag[]>([]);
    const [styleTags, setStyleTags]: [ITag[], (tag: ITag[]) => void] = useState<ITag[]>([]);
    const [otherTags, setOtherTags]: [ITag[], (tag: ITag[]) => void] = useState<ITag[]>([]);

    const [loading, setLoading] = useState(false);
    const user = getCurrenUser();

    useEffect(() => {
        async function getTags() {
            setLoading(true);
            let url = 'tags';
            try {
                const response = await getApiContent(url, user);
                const tags: ITag[] = response.data;
                setGenreTags(tags.filter(tag => tag.type === 'subgenre'));
                setStyleTags(tags.filter(tag => tag.type === 'style'));
                setOtherTags(tags.filter(tag => tag.type === null));
            } catch (e) {
                console.log(e);
            }
            setLoading(false);
        }
        getTags();
    }, [id])

    const renderTags = (tags: ITag[]) => {
        return tags.map((tag: ITag) => {
            return <><Link to={`/tags/${tag.id}`} key={tag.id}>{tag.name}</Link><br /></>
        })
    }

    return (
        <main>
            {
                loading ? (
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
                            {genreTags !== null && genreTags !== undefined && genreTags.length > 0 && (
                                <div className="grid col-12 mb-3">
                                    <h2>Alagenret</h2>
                                    <div className="three-column">
                                        {renderTags(genreTags)}
                                    </div>
                                </div>
                            )}
                            {styleTags !== null && styleTags !== undefined && styleTags.length > 0 && (
                                <div className="grid col-12 mb-3">
                                    <h2>Tyylit</h2>
                                    <div className="three-column">
                                        {renderTags(styleTags)}
                                    </div>
                                </div>
                            )}
                            {otherTags !== null && otherTags !== undefined && otherTags.length > 0 && (
                                <div className="grid col-12 mb-3">
                                    <h2>Muut asiasanat</h2>
                                    <div className="three-column">
                                        {renderTags(otherTags)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
            }
        </main>
    )
}