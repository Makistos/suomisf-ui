import { Link } from 'react-router-dom';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { getApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
import { ProgressSpinner } from "primereact/progressspinner";
import { useParams } from "react-router-dom";
import { IWork } from "./Work";
import { WorkList } from './WorkList';
import { ShortsList } from './ShortsList';
import { IArticle } from './Article';
import { IShort } from './Short';
import { ArticleList } from './ArticleList';
export interface ITag {
    id: number,
    name: string,
    type: string,
    works?: IWork[],
    shorts?: IShort[],
    articles?: IArticle[]
}

interface TagProps {
    id?: number | null,
    tag?: string,
    count?: number | null
}

interface TagsProps {
    tags: ITag[],
    overflow: number,
    showOneCount: boolean
}

export const PickTagLinks = (tags: ITag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }))
}

export const TagGroup = ({ tags, overflow, showOneCount }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<[string, number][]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);

    const filterTypes = (tags: ITag[], type: string) => {
        return tags.filter(tag => tag.type === type)
            .map(tag => tag.name)
    }

    useEffect(() => {
        const countTags = () => {
            let retval = tags.reduce((acc, currentValue: ITag) => {
                const tagName: string = currentValue.name;
                if (!acc[tagName]) {
                    acc[tagName] = 1;
                } else {
                    acc[tagName]++;
                }
                return acc;
            }, {} as Record<string, number>)
            return retval;
        }
        if (tags) {
            setGroupedTags(Object.entries(countTags())
                .sort((a, b) => a[1] > b[1] ? -1 : 1)
                .map(tag => tag));
            setSubgenres(filterTypes(tags, 'subgenre'))
            setStyles(filterTypes(tags, 'style'))
        }
    }, [tags])


    const TagCount = ({ tag, count }: TagProps) => {
        const TypeToSeverity = (type: string) => {
            if (tag === undefined) return "";
            if (type !== null) {
                if (subgenres.includes(tag)) {
                    return "success";
                }
                if (styles.includes(tag)) {
                    return "warning";
                }
            }
            return "";
        }

        const headerText = (name: string, count: number | null) => {
            if (count !== null) {
                return name + " x " + count;
            } else {
                return name;
            }
        }

        return (
            <Tag value={headerText(tag === undefined ? "" : tag, count === undefined ? 0 : count)}
                className="p-overlay-badge"
                severity={TypeToSeverity(tag === undefined ? "" : tag)}
            />
        )
    }
    return (
        <div className="flex justify-content-center flex-wrap m-0 p-0">
            {groupedTags.map((tag, idx) => {
                return (overflow === undefined || idx < overflow || showAll) &&
                    <span key={tag[0]} className="mr-1 mb-1">
                        <TagCount tag={tag[0]}
                            count={showOneCount && tag[1] !== 1 ? tag[1] : null} />
                    </span>
            })}
            {(overflow !== undefined
                && groupedTags.length > overflow
                && !showAll ? (
                <Button label="+" badge={(groupedTags.length - overflow).toString()}
                    className="p-button-sm p-button-help"
                    onClick={(e) => setShowAll(true)}
                />
            ) : (groupedTags.length > overflow &&
                <Button label="Vähemmän" onClick={(e) => setShowAll(false)}
                    className="p-button-sm p-button-help" />
            ))}
        </div>
    )

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
    }, [id, user])

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
                                    <h2>Aligenret</h2>
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
export const SFTag = ({ id }: TagProps) => {
    const params = useParams();
    const [tag, setTag]: [ITag | null, (tag: ITag) => void] = useState<ITag | null>(null);
    const [loading, setLoading] = useState(false);
    const user = getCurrenUser();

    useEffect(() => {
        async function getTag() {
            let url = 'tags/' + params.tagid?.toString();
            try {
                setLoading(true);
                const response = await getApiContent(url, user);
                setTag(response.data);
                setLoading(false);
            } catch (e) {
                console.log(e);
            }
        }
        getTag();
    }, [params.tagid, user])

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
                        <div className="grid justify-content-center min-w-full">
                            <div className="grid justify-content-center col-12 mt-5 mb-5 min-w-full">
                                <h1 className="maintitle min-w-full">{tag?.name}</h1>
                            </div>
                            {tag?.works && tag.works.length > 0 &&
                                <div className="grid col-12 mt-5">
                                    <h2 className="mb-5">Teokset</h2>
                                    <WorkList works={tag?.works} />
                                </div>
                            }
                            {tag?.shorts && tag.shorts.length > 0 &&
                                <div className="grid col-12 mt-5">
                                    <h2 className="mb-5">Novellit</h2>
                                    <ShortsList shorts={tag?.shorts} />
                                </div>
                            }
                            {tag?.articles && tag.articles.length > 0 &&
                                <div className="col-12 mt-5">
                                    <h2 className="mb-5">Artikkelit</h2>
                                    <ArticleList articles={tag.articles} />
                                </div>
                            }
                        </div>
                    )
            }
        </main>
    )
}