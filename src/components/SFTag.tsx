import { Link, Navigate, Route, useNavigate } from 'react-router-dom';
import { Tag } from 'primereact/tag';
import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { getApiContent, deleteApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
import { ProgressSpinner } from "primereact/progressspinner";
import { useParams } from "react-router-dom";
import { IWork } from "./Work";
import { WorkList } from './WorkList';
import { ShortsList } from './ShortsList';
import { IArticle } from './Article';
import { IShort } from './Short';
import { ArticleList } from './ArticleList';
import { SpeedDial } from 'primereact/speeddial';
import { Tooltip } from "primereact/tooltip";
import { Dialog } from 'primereact/dialog';
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { InputText } from 'primereact/inputtext';
import { classNames } from "primereact/utils";
import { AutoComplete } from 'primereact/autocomplete';
import { IMagazine } from '../Magazine';
import { IPerson } from './Person';
import { IIssue } from '../Issue';
import { IUser } from '../user';
import axios from 'axios';
import { API_URL } from '../systemProps';
import { ConfirmDialog } from 'primereact/confirmdialog';
import authHeader from '../services/auth-header';


export interface ITag {
    id: number,
    name: string,
    type: string,
    works?: IWork[],
    shorts?: IShort[],
    articles?: IArticle[],
    magazines?: IMagazine[],
    people?: IPerson[],
    issues?: IIssue[]
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
export const SFTag = ({ id }: TagProps) => {
    const params = useParams();
    const [tag, setTag]: [ITag | null, (tag: ITag) => void] = useState<ITag | null>(null);
    const [displayChangeName, setDisplayChangeName] = useState(false);
    const [displayMerge, setDisplayMerge] = useState(false);
    const [displayDelete, setDisplayDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser]: [IUser | null, (user: IUser) => void] = useState(getCurrenUser());
    const navigate = useNavigate();

    // useEffect(() => {
    //     setDeleteDisabled(!tagHasContent(tag));
    // }, [tag, user])

    const dialogFuncMap: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
        'displayChangeName': setDisplayChangeName,
        'displayMerge': setDisplayMerge,
        'displayDelete': setDisplayDelete
    }

    const tagHasContent = (tag: ITag | null) => {
        if (tag === undefined || tag === null) return false;
        if (tag?.articles && tag.articles.length > 0) return true;
        if (tag?.issues && tag.issues.length > 0) return true;
        if (tag?.magazines && tag.magazines.length > 0) return true;
        if (tag?.people && tag.people.length > 0) return true;
        if (tag?.shorts && tag.shorts.length > 0) return true;
        if (tag?.works && tag.works.length > 0) return true;
        return false;
    }

    const onSpeeddialClick = (name: string) => {
        dialogFuncMap[`${name}`](true);
    }

    const onHide = (name: string) => {
        dialogFuncMap[`${name}`](false);
    }

    const dialItems = [
        {
            label: 'Nimeä uudelleen',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                onSpeeddialClick('displayChangeName');
            }
        },
        {
            label: 'Yhdistä',
            icon: 'fa-solid fa-object-ungroup',
            command: () => {
                onSpeeddialClick('displayMerge');
            }
        },
        {
            label: 'Poista',
            icon: 'fa-solid fa-trash-can',
            //disabled: { deleteDisabled },
            command: () => {
                onSpeeddialClick('displayDelete');
            }
        }
    ]

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

    const ChangeNameDialog = () => {
        type IName = {
            name: string
        }
        const form = useForm<IName>();
        const changeName: SubmitHandler<IName> = (data) => {
            async function rename() {
                if (tag) {
                    let p: ITag = {
                        'id': tag.id,
                        'name': data.name,
                        'type': tag.type
                    };
                    await axios.put(API_URL + 'tags', p, { headers: authHeader() })
                        .then(response => {
                            console.log(response.data);
                            setTag(response.data)
                        }).catch(err => {
                            if (err.response) {
                                console.log("Server error: " + JSON.stringify(err.response, null, 2));
                            } else if (err.request) {
                                console.log("No response: " + JSON.stringify(err.request, null, 2));
                            } else {
                                console.log("Other error: " + JSON.stringify(err.toString, null, 2));
                            }
                        })
                }
            }
            console.log(data);
            rename();
            setDisplayChangeName(false);
        }
        return (
            <div className="grid col justify-content-center">
                <form onSubmit={form.handleSubmit(changeName)}>
                    <div className="grid mt-3 col">
                        <span className="grid col">
                            <label htmlFor="name">Uusi nimi</label>
                            <Controller name="name" control={form.control}
                                render={({ field, fieldState }) => (
                                    <InputText
                                        id={field.name} {...field} autoFocus
                                        className={classNames({ 'p-invalid': fieldState.error }, 'w-full')} />
                                )} />
                        </span>
                    </div>
                    <div className="grid col">
                        <Button type="submit" className="w-full justify-content-center">
                            Vaihda
                        </Button>
                    </div>

                </form>
            </div>
        )
    }

    const MergeTagsDialog = () => {
        type ITagInfo = {
            id: number,
            name: string
        }
        const { control, handleSubmit, formState: { errors } } = useForm<ITagInfo>();
        const [filteredTags, setFilteredTags] = useState<any>(null);
        const [selectedTag, setSelectedTag] = useState<any>(null);
        const mergeTags: SubmitHandler<ITagInfo> = (data) => {
            console.log(data);
        }

        async function getTags(query: string) {
            try {
                const response = await getApiContent("tagSearch/" + query, user);
                // console.log(response.data);
                setFilteredTags(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        const searchTags = (event: any) => {
            getTags(event.query);
        }

        const selectTag = (tag: ITagInfo) => {
            setSelectedTag(null);
        }

        const searchText = (str: string) => {
            if (str.length > 300) {
                str = str.slice(0, 298);
                str = str + "...";
            }
            let tmp = document.createElement("DIV");
            tmp.innerHTML = str;
            return tmp.textContent || tmp.innerText || "";
        }

        const tagTemplate = (item: any) => {
            return (
                <div>
                    <span>{searchText(item.name)}</span>
                </div>
            )
        }
        return (
            <div className="grid col justify-content-center">
                <form onSubmit={handleSubmit(mergeTags)}>
                    <div className="grid col mt-3">
                        <span className="grid col">
                            <label htmlFor="name" >Yhdistettävä asiasana</label>
                            <Controller name="name" control={control}
                                render={({ field, fieldState }) => (
                                    <AutoComplete
                                        id={field.name}
                                        value={field.value}
                                        field="name"
                                        onChange={(e) => field.onChange(e.target.value)}
                                        completeMethod={searchTags}
                                        suggestions={filteredTags}
                                        itemTemplate={tagTemplate}
                                        delay={800}
                                        minLength={2}
                                        scrollHeight="400px"
                                        className={classNames({ 'p-invalid': fieldState.error }, 'w-full')} />
                                )} />
                        </span>
                    </div>
                    <div className="grid col">
                        <Button type="submit" className="w-full justify-content-center">
                            Yhdistä
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    const DeleteDialog = () => {
        return (
            <div></div>
        )
    }

    const deleteTag = () => {
        const deleteTagFromDb = () => {
            if (tag) {
                deleteApiContent("tags/" + tag.id.toString());
            }
        }

        deleteTagFromDb();
        navigate('/tags', { replace: true });
    }

    return (
        <main>
            <Dialog header="Nimeä uudelleen" visible={displayChangeName} onHide={() => onHide('displayChangeName')}>
                <ChangeNameDialog />
            </Dialog>

            <Dialog header="Asiasanan yhdistäminen" visible={displayMerge} onHide={() => onHide('displayMerge')}>
                <MergeTagsDialog />
            </Dialog>

            {/* <Dialog header="Poista" visible={displayDelete} onHide={() => onHide('displayDelete')}>
                <DeleteDialog />
            </Dialog> */}
            <ConfirmDialog visible={displayDelete}
                onHide={() => setDisplayDelete(false)}
                message="Oletko varma että haluat poistaa asiasanan?"
                header="Asiasanan poistaminen"
                icon="pi pi-excalamation-triangle"
                accept={deleteTag}
                reject={() => setDisplayDelete(false)}
            />
            <div className="mt-5 speeddial style={{position: 'relative', height: '500px}}">
                {user && user.role == "admin" &&
                    <div>
                        <Tooltip target=".speeddial .speeddial-right .p-speeddial-action" position="left" />
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction="left"
                            type="semi-circle"
                            radius={80}
                        />
                    </div>
                }
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
                                    <h1 className="maintitle min-w-full justify-content-center">{tag?.name}</h1>
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
            </div>
        </main>
    )
}