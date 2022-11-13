import { useRef } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import type { IPerson } from "./Person";
import type { IWork } from "../feature/Work/Work";
import type { IShort } from "./Short"
import type { IAward } from "./Award";
import type { IAwardCategory } from "./AwardCategory";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { classNames } from "primereact/utils";

export interface IAwarded {
    id: number,
    year: number,
    award: IAward,
    person: IPerson,
    work: IWork,
    category: IAwardCategory,
    story: IShort
}

interface AwardedProps {
    awards: IAwarded[];
}

export const Awarded = ({ awards }: AwardedProps) => {

    const awardIcon = (rowData: IAwarded) => {
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

    const targetTemplate = (rowData: IAwarded) => {
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

export const AwardPanel = ({ awards }: AwardedProps) => {
    const op = useRef<OverlayPanel>(null);

    const buttonHeader = () => {
        return "Palkinnot (" + awards.length.toString() + ")";
    }
    if (!awards) return null;

    return (
        <div>
            <Button
                type="button"
                label={buttonHeader()}
                className="p-button-secondary"
                icon="fa-solid fa-award"
                onClick={(e) => op.current?.toggle(e)}
                aria-haspopup
                aria-controls="awards_panel"
                disabled={awards.length === 0}
            />
            <OverlayPanel
                ref={op}
                id="awards_panel">
                <Awarded awards={awards} />
            </OverlayPanel>
        </div>
    )
}