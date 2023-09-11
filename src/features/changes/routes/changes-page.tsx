import { Link } from "react-router-dom";

import { DataTable, DataTableExpandedRows, DataTableRowToggleEvent, DataTableValueArray } from "primereact/datatable";
import { useQuery } from '@tanstack/react-query';
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

import { LogItem } from "../types";
import { getApiContent } from "../../../services/user-service";
import { useState } from "react";

export const Changes = () => {
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | LogItem[]>([]);

  const fetchData = async (): Promise<LogItem[]> => {
    let changesList: LogItem[] = [];
    changesList = await getApiContent("changes", null).then(response => {
      return response.data
    })
      .catch((error) => console.log(error));
    console.log("Response: " + changesList);
    return changesList;
  }

  const { isLoading, data } = useQuery({
    queryKey: ["changes"],
    queryFn: () => fetchData()
  });

  const linkTemplate = (rowData: LogItem) => {
    if (rowData.table_name === "Teos") {
      return (
        <Link to={`/works/${rowData.table_id}`} key={rowData.table_id}>
          {rowData.object_name}
        </Link>
      )
    }
    if (rowData.table_name === "Painos") {
      return (
        <Link to={`/editions/${rowData.table_id}`} key={rowData.table_id}>
          {rowData.object_name}
        </Link>
      )
    }
    if (rowData.table_name === "Henkilö") {
      return (
        <Link to={`/people/${rowData.table_id}`} key={rowData.table_id}>
          {rowData.object_name}
        </Link>
      )
    }
  }

  const headerTemplate = (data: LogItem) => {
    return (
      <>
        <span className="vertical-align-middle ml-2 font-bold line-height-3">
          {data.object_name} ({data.table_name})
        </span>
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
              sortOrder={1}
              expandableRowGroups
              expandedRows={expandedRows}
              onRowToggle={(e: DataTableRowToggleEvent) => setExpandedRows(e.data)}
              rowGroupHeaderTemplate={headerTemplate}
              paginator rows={100} rowsPerPageOptions={[10, 20, 50]} >
              <Column field="object_name" header="Nimi" body={linkTemplate}
                filter filterField="object_name"
              ></Column>
              <Column field="table_name" header="Taulu" ></Column>
              <Column field="field_name" header="Tietue"></Column>
              {/*
            <Column field="old_value" header="Vanha arvo"></Column>
            <Column field="new_value" header="Uusi arvo"></Column>
  */}
              <Column field="date" header="Muutettu"></Column>
              <Column field="action" header="Toiminto"></Column>
            </DataTable>
          </>
        }
      </div>
    </main>
  )
}
