import { Link } from "react-router-dom";

import { DataTable, DataTableExpandedRows, DataTableRowToggleEvent } from "primereact/datatable";
import { useQuery } from '@tanstack/react-query';
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

import { LogItem } from "../types";
import { getApiContent } from "../../../services/user-service";
import { useState } from "react";

// Page of each logged table (log.table_name), by its route in index.tsx.
const tablePaths: Record<string, string> = {
  "Teos": "works",
  "Painos": "editions",
  "Henkilö": "people",
  "Novelli": "shorts",
  "Kustantaja": "publishers",
  "Kirjasarja": "bookseries",
  "Julkaisusarja": "pubseries",
  "Lehti": "magazines",
  "Irtonumero": "issues",
  "Asiasana": "tags",
  "Palkinto": "awards",
};

export const Changes = () => {
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | LogItem[]>([]);

  const fetchData = async (): Promise<LogItem[]> => {
    let changesList: LogItem[] = [];
    changesList = await getApiContent("changes", null).then(response => {
      return response.data
    })
      .catch((error) => console.log(error));
    // console.log("Response: " + changesList);
    return changesList;
  }

  const { isLoading, data } = useQuery({
    queryKey: ["changes"],
    queryFn: () => fetchData()
  });

  const linkTemplate = (rowData: LogItem) => {
    const path = tablePaths[rowData.table_name];
    // A deleted row has no page left to link to.
    if (!path || rowData.action === "Poisto") {
      return rowData.object_name;
    }
    return (
      <Link to={`/${path}/${rowData.table_id}`} key={rowData.table_id}>
        {rowData.object_name}
      </Link>
    )
  }

  const headerTemplate = (data: LogItem) => {
    return (
      <>
        <span className="vertical-align-middle ml-2 font-bold line-height-3">
          {data.object_name}&nbsp;
        </span>
        ({data.table_name})
      </>
    )
  }

  return (
    <main className="all-content">
      <div>
        <h1 className="text-center">Muutokset</h1>
        {isLoading ?
          <div className="progressbar">
            <ProgressSpinner />
          </div>
          :
          <>
            <DataTable
              value={data}
              rowGroupMode="subheader"
              groupRowsBy="object_name"
              sortMode="single"
              sortField="date"
              sortOrder={-1}
              expandableRowGroups
              expandedRows={expandedRows}
              onRowToggle={(e: DataTableRowToggleEvent) => setExpandedRows(e.data)}
              rowGroupHeaderTemplate={headerTemplate}
              paginator
              rows={50}
              rowsPerPageOptions={[25, 50, 100]}
            >
              <Column field="object_name" header="Nimi" body={linkTemplate}
                filter filterField="object_name"
              ></Column>
              <Column field="table_name" header="Taulu"
                filter filterField="table_name"></Column>
              <Column field="field_name" header="Tietue"></Column>
              {/*
            <Column field="old_value" header="Vanha arvo"></Column>
            <Column field="new_value" header="Uusi arvo"></Column>
  */}
              <Column field="date" header="Muutettu"></Column>
              <Column field="action" header="Toiminto"
                filter filterField="action"
              ></Column>
            </DataTable>
          </>
        }
      </div>
    </main>
  )
}
