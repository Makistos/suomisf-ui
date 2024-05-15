import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from "react-router-dom";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from 'primereact/button';
import { ProgressSpinner } from "primereact/progressspinner";
import { SpeedDial } from 'primereact/speeddial';
import { Tooltip } from "primereact/tooltip";
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from "primereact/utils";
import { AutoComplete } from 'primereact/autocomplete';
import { ConfirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';

import { getApiContent, deleteApiContent } from '@services/user-service';
import { getCurrenUser } from '@services/auth-service';
import { WorkList } from '@features/work';
import { ShortsList } from '@features/short';
import { ArticleList } from '@features/article';
import authHeader from '@services/auth-header';
import { SfTag, SfTagProps } from '../types';
import { SfTagForm } from '../components/sftag-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Toast } from 'primereact/toast';
import { getTag } from '@api/tag/get-tag';
import { mergeTags } from '@api/tag/merge-tags';
import { Tag } from 'primereact/tag';
import { tagTypeToSeverity } from '../components/tag-type-to-severity';
import { deleteTag } from '@api/tag/delete-tag';
import { filterTags } from '@api/tag/filter-tags';


export const SFTag = ({ id }: SfTagProps) => {
    const params = useParams();
    // const [tag, setTag]: [SfTag | null, (tag: SfTag) => void] = useState<SfTag | null>(null);
    const [displayChangeName, setDisplayChangeName] = useState(false);
    const [displayMerge, setDisplayMerge] = useState(false);
    const [displayDelete, setDisplayDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const user = useMemo(() => { return getCurrenUser() }, []);
    const navigate = useNavigate();
    const toastRef = useRef<Toast>(null);

    const dialogFuncMap: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
        'displayChangeName': setDisplayChangeName,
        'displayMerge': setDisplayMerge,
        'displayDelete': setDisplayDelete
    }

    const queryClient = useQueryClient();

    // const tagHasContent = (tag: TagType | null) => {
    //     if (tag === undefined || tag === null) return false;
    //     if (tag?.articles && tag.articles.length > 0) return true;
    //     if (tag?.issues && tag.issues.length > 0) return true;
    //     if (tag?.magazines && tag.magazines.length > 0) return true;
    //     if (tag?.people && tag.people.length > 0) return true;
    //     if (tag?.shorts && tag.shorts.length > 0) return true;
    //     if (tag?.works && tag.works.length > 0) return true;
    //     return false;
    // }

    const onSpeeddialClick = (name: string) => {
        dialogFuncMap[`${name}`](true);
    }

    const onHide = (name: string) => {
        dialogFuncMap[`${name}`](false);
    }

    const dialItems = [
        {
            label: 'Muokkaa',
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

    const { isLoading, data } = useQuery({
        queryKey: ['tags', params.tagid],
        queryFn: () => getTag(Number(params.tagid), user)
    })

    const MergeTagsDialog = () => {
        type TagTypeInfo = {
            id: number,
            name: string
        }
        const { control, handleSubmit } = useForm<Record<string, TagTypeInfo>>();
        const [filteredTags, setFilteredTags] = useState<any>(null);
        const [selectedTag, setSelectedTag] = useState<any>(null);
        const mergeTagsSubmit: SubmitHandler<Record<string, TagTypeInfo>> = (data) => {
            const source = Number(data.name.id);
            if (source && params.tagid) {
                mergeTags(Number(params.tagid), source, user);
            }
            onHide('displayMerge');
        }

        async function getTags(query: string) {
            try {
                const response = await filterTags(query, user);
                // console.log(response.data);
                setFilteredTags(response);
            } catch (e) {
                console.error(e);
            }
        }
        const searchTags = (event: any) => {
            getTags(event.query);
        }

        const selectTag = (tag: TagTypeInfo) => {
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
                <form onSubmit={handleSubmit(mergeTagsSubmit)}>
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

    const deleteTagFunc = () => {
        if (data) {
            deleteTag(data.id);
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            navigate(-1);
        }
    }

    const onTagSubmit = (status: boolean, message: string) => {
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 6000 });
        }
        onHide('displayChangeName');
    }

    return (
        <main className="all-content">
            <Toast ref={toastRef} />
            <Dialog header="Muokkaa" visible={displayChangeName} onHide={() => onHide('displayChangeName')}>
                <SfTagForm tagId={(data && data.id) ? data.id : null}
                    onSubmitCallback={onTagSubmit} />
            </Dialog>

            <Dialog header="Asiasanan yhdistäminen" visible={displayMerge} onHide={() => onHide('displayMerge')}>
                <MergeTagsDialog />
            </Dialog>

            <ConfirmDialog visible={displayDelete}
                onHide={() => setDisplayDelete(false)}
                message="Oletko varma että haluat poistaa asiasanan?"
                header="Asiasanan poistaminen"
                icon="pi pi-excalamation-triangle"
                accept={deleteTagFunc}
                reject={() => setDisplayDelete(false)}
            />

            <div className="mt-5 speeddial style={{position: 'relative', height: '500px}}">
                {user && user.role === "admin" &&
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
                                    <h1 className="maintitle min-w-full justify-content-center">{data?.name}</h1>
                                </div>
                                <div className="grid col-12">
                                    <Tag value={data?.type?.name}
                                        severity={data ? tagTypeToSeverity(data) : undefined}
                                    />
                                </div>
                                {data?.works && data.works.length > 0 &&
                                    <div className="grid col-12 mt-5">
                                        <h2 className="mb-5">Teokset</h2>
                                        <WorkList works={data?.works} />
                                    </div>
                                }
                                {data?.stories && data.stories.length > 0 &&
                                    <div className="grid col-12 mt-5">
                                        <h2 className="mb-5">Novellit</h2>
                                        <ShortsList shorts={data?.stories} />
                                    </div>
                                }
                                {data?.articles && data.articles.length > 0 &&
                                    <div className="col-12 mt-5">
                                        <h2 className="mb-5">Artikkelit</h2>
                                        <ArticleList articles={data.articles} />
                                    </div>
                                }
                            </div>
                        )
                }
            </div>
        </main>
    )
}
