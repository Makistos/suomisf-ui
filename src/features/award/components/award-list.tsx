import React from 'react';

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { classNames } from "primereact/utils";

import { Awarded } from "../types";

export interface AwardedProps {
    awards: Awarded[];
}

export const AwardList = ({ awards }: AwardedProps) => {

    const awardIcon = (rowData: Awarded) => {
        if (rowData.person) {
            return <i className={classNames('fa', 'fa-user')}></i>
        }
        if (rowData.work) {
            return <i className={classNames('fa', 'fa-book')}></i>
        }
        if (rowData.story) {
            return <i className={classNames('fa', 'fa-scroll')}></i>
        }
    }

    const targetTemplate = (rowData: Awarded) => {
        if (rowData.work) {
            return rowData.work.title;
        }
        if (rowData.story) {
            return rowData.story.title;
        }
        return "";
    }

    return (
        <div>
            {awards && awards.length > 0 && (
                <DataTable value={awards}
                    header="Palkinnot"
                    responsiveLayout="stack"
                    className="trophy-table"
                >
                    <Column field="icon" header="Tyyppi" body={awardIcon} />
                    <Column field="year" header="Vuosi" />
                    <Column field="award.name" header="Palkinto" />
                    <Column field="category.name" header="Kategoria" />
                    <Column field="target" header="Palkittu" body={targetTemplate} />
                </DataTable>
            )}
        </div>
    )
}

