import { Link } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { useQuery } from '@tanstack/react-query';
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

import { LogItem } from "../types";
import { getApiContent } from "../../../services/user-service";

export const Changes = () => {

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
            <DataTable value={data} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} >
              <Column field="object_name" header="Nimi" body={linkTemplate}></Column>
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
