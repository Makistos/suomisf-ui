import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { WorkList } from "../../work";
import { Bookseries } from "../types";
import { selectId } from "../../../utils";
import { User } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';

const baseURL = 'bookseries/';

interface BookseriesPageProps {
    id: string | null;
}

let thisId = "";

export const BookseriesPage = ({ id }: BookseriesPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [formData, setFormData] = useState<Bookseries | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true)
    const [formHeader, setFormHeader] = useState("")

    const toast = useRef<Toast>(null);

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries.`);
    }

    const fetchBookseries = async (id: string, user: User | null): Promise<Bookseries> => {
        const url = baseURL + id;
        const data = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, isError, data } = useQuery({
        queryKey: ["bookseries", thisId],
        queryFn: () => fetchBookseries(thisId, user),
        enabled: queryEnabled
    });

    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.name);
    }, [data])

    const dialItems = [
        {
            label: 'Uusi kirjasarja',
            icon: 'fa-solid fa-circle-plus',
            command: () => {

                setFormData(null)
                setFormHeader("Uusi kirjasarja")
                setIsFormVisible(true)
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                if (data) {
                    setFormData(data)
                    setFormHeader("Muokkaa kirjasarjaa")
                    setIsFormVisible(true)
                }
            }
        }
    ]

    const queryClient = useQueryClient()

    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["bookseries", thisId] })
        setQueryEnabled(true)
        setIsFormVisible(false)

    }

    const onDialogShow = () => {
        setIsFormVisible(true)
        setQueryEnabled(false)
    }

    if (isError) {

    }

    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px' }}">
                <div>
                    <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action"
                    />
                </div>
                <SpeedDial className="speeddial-right"
                    model={dialItems}
                    direction="left"
                    type="semi-circle"
                    radius={80}
                />
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    visible={isFormVisible}
                    onShow={() => onDialogShow()}
                    onHide={() => onDialogHide()}
                    header={formHeader}
                >

                </Dialog>
                {isLoading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>

                ) : (
                    <>
                        <div className="mb-5">
                            <div className="grid col-12 mb-1 justify-content-center">
                                <h1 className="maintitle">{data?.name}</h1>
                            </div>
                            {data?.orig_name && (
                                <div className="grid col-12 mt-0 justify-content-center">
                                    <h2>({data?.orig_name})</h2>
                                </div>
                            )}
                        </div>
                        {data &&
                            <div className="mt-5">
                                <WorkList works={data.works} />
                            </div>
                        }
                    </>
                )}
            </div>
        </main>
    )
}
