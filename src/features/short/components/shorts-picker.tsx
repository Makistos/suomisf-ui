/**
 * Control that allows user to pick shorts for an edition or work.
 *
 * Contains a control for picking author and a when selected, fills another
 * with shorts written by that author.
 *
 * Main control shows the shorts for the selected edition or work. This list
 * can be edited by adding or removing items and by reordering them.
 */
import { useEffect, useMemo, useState } from "react";

import { AutoComplete } from "primereact/autocomplete";
import { OrderList } from "primereact/orderlist"
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useQueryClient } from "@tanstack/react-query";

import { getCurrenUser } from "@services/auth-service";
import { Person } from "@features/person";
import { Short } from "../types";
import { useFilterPeople } from "@hooks/use-people-filter"
import { getApiContent, putApiContent } from "@services/user-service";
import { ShortsForm } from "./shorts-form";
import { saveIssueShorts } from "@api/issue/save-issue-shorts";
import { getIssueShorts } from "@api/issue/get-issue-shorts";

type PickerProps = {
  id: string,
  onClose: () => void,
}

export const EditionShortsPicker = ({ id }: PickerProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const [shorts, setShorts] = useState<Short[]>([]);

  useEffect(() => {
    const getEditionShorts = async () => {
      const response = await getApiContent('editions/' + id.toString() + '/shorts', user);
      setShorts(response.data);
    }
    if (id) {
      getEditionShorts();
    }
  }, [])

  const saveShortsToEdition = (shorts: Short[]): number => {
    const ids = shorts.map(short => short.id);
    const data = { edition_id: id, shorts: ids }
    const response = putApiContent('editions/shorts', data, user);
    return 200
  }

  return (
    <>
      <ShortsPicker source={shorts}
        saveCallback={saveShortsToEdition}
      />
    </>
  )
}

export const WorkShortsPicker = ({ id, onClose }: PickerProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const [shorts, setShorts] = useState<Short[]>([]);
  const isDirty = false;
  const queryClient = useQueryClient();

  useEffect(() => {
    const getWorkShorts = async () => {
      const response = await getApiContent('works/shorts/' + id.toString(), user);
      setShorts(response.data);
    }
    if (id && !isDirty) {
      getWorkShorts();
    }
  }, [])

  const saveShortsToWork = (shorts: Short[]): number => {
    const ids = shorts.map(short => short.id)
    const data = { work_id: id, shorts: ids }
    const response = putApiContent('works/shorts', data, user);
    onClose();
    return 200
  }

  return (
    <>
      <ShortsPicker source={shorts}
        saveCallback={saveShortsToWork}
      />
    </>
  )
}

export const IssueShortsPicker = ({ id, onClose }: PickerProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const [shorts, setShorts] = useState<Short[]>([]);

  useEffect(() => {
    const getShorts = async () => {
      const response = await getIssueShorts(id, user);
      setShorts(response);
    }
    if (id) {
      getShorts();
    }
  }, [])

  const saveShortsToIssue = (shorts: Short[]): number => {
    const ids = shorts.map(short => short.id)
    const data = { issue_id: id, shorts: ids }
    const response = saveIssueShorts(data, user).then(
      (response) => {
        onClose();
        return response.status;
      }
    );
    return 200;
  }

  return (
    <>
      <ShortsPicker source={shorts}
        saveCallback={saveShortsToIssue}
      />
    </>
  )
}


interface ShortsPickerProps {
  source: Short[],
  saveCallback: (shorts: Short[]) => number,
}

const ShortsPicker = ({ source, saveCallback }: ShortsPickerProps) => {
  const user = getCurrenUser();
  // Person selected in the dropdown
  //const [selectedPerson, setSelectedPerson] = useState<Person | string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  // Shorts written by selected person
  const [personShorts, setPersonShorts] = useState<Short[]>([]);
  // Shorts that have been selected for this item
  const [selectedItemShorts, setSelectedItemShorts] = useState<Short[]>([]);
  // Short selected in the dropdown
  const [selectedShort, setSelectedShort] = useState<Short | null>(null);
  // People matching search query
  // const [filteredPeople, filterPeople] = useFilterPeople();
  const [filteredPeople, setFilteredPeople] = useState<any>([]);

  const [hasChanged, setHasChanged] = useState(false);
  const [isShortFormVisible, setIsShortFormVisible] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const getShorts = async () => {
      if (selectedPerson !== null && selectedPerson !== undefined &&
        typeof selectedPerson !== 'string') {
        const response = await getApiContent('people/' + selectedPerson.id + '/shorts', user);
        const shorts = response.data.sort((a: Short, b: Short) => a.title.localeCompare(b.title));
        setPersonShorts(shorts);
      }
    }
    getShorts();
  }, [selectedPerson])

  useEffect(() => {
    setSelectedItemShorts(source);
  }, [source])

  async function filterPeople(event: any) {
    const url =
      "filter/people/" + event.query;
    // console.log("Person search url:" + url);
    const response = await getApiContent(url, user);
    const p = response.data;
    setFilteredPeople(p);
    return p;
  }

  const addToSelected = () => {
    if (selectedShort === null) {
      return;
    }
    const newShorts = [...selectedItemShorts, selectedShort] as Short[];
    setSelectedItemShorts(newShorts);
    setHasChanged(true);
  }

  const removeFromSelected = (id: number) => {
    const newShorts = selectedItemShorts.filter(short => short.id !== id) as (Short[]);
    setSelectedItemShorts(newShorts);
    setHasChanged(true);
  }

  /**
   * Returns a string of authors' names for a given short.
   *
   * @param short - The short object to extract authors from.
   * @return A string of authors' names separated by commas.
   */
  const authorsString = (short: Short) => {
    const authors = new Set(
      short.contributors
        .filter(contribution => contribution.role.name === 'Kirjoittaja')
        .map(contrib => contrib.person.alt_name)
    );
    return Array.from(authors).join(', ');
  }

  const itemTemplate = (item: Short) => {
    return (
      <div className="flex">
        <div className="flex-1 flex-column">
          {authorsString(item)}
        </div>
        <div className="flex-1 flex-column">
          <b>{item.title}</b>
        </div>
        <div className="flex-1 flex-column">
          {item.orig_title && item.orig_title != item.title &&
            item.orig_title
          }
        </div>
        <div className="flex-1 flex-column">
          {item.pubyear &&
            item.pubyear
          }
        </div>
        <div className="flex-1 flex-column">
          <Button type="button" icon="pi pi-times"
            onClick={() => removeFromSelected(item.id)}>
          </Button>
        </div>
      </div>
    )
  }
  const dropDownShortTemplate = (item: Short) => {
    let shortTitle = item.title;
    if (item.orig_title) {
      shortTitle += ` (${item.orig_title})`;
    }
    if (item.pubyear) {
      shortTitle += ` (${item.pubyear})`;
    }
    return <div>{shortTitle}</div>;
  };

  const clearPerson = () => {
    setSelectedPerson(null);
    setPersonShorts([]);
  }

  const personTemplate = (item: Person) => {
    return (
      <div className="flex align-items-stretch">
        <div className="flex justify-content-center">
          <b>{item.name}</b>
        </div>
        <div className="flex justify-content-center">
          {item.nationality && <i>{item.nationality.name}</i>}
        </div>
        <div className="flex justify-content-center">
          ({item.dob} - {item.dod})
        </div>
        <div className="flex justify-content-center">
          {item.storycount}
        </div>
      </div>
    )
  }

  const onShortDialogShow = () => {

  }

  const onShortDialogHide = () => {
    setIsShortFormVisible(false);
  }

  const onNewShort = async (id: string, visible: boolean) => {
    const response: Short = await getApiContent('shorts/' + id, user).then(response =>
      response.data)
    const newShorts: Short[] = selectedItemShorts;
    newShorts.push(response);
    setSelectedItemShorts(newShorts);
    setHasChanged(true);
    setIsShortFormVisible(visible);
  }

  const onSave = (shorts: Short[]) => {
    saveCallback(shorts);
  }

  return (
    <div className="card mt-3">
      <Dialog maximizable blockScroll
        onShow={() => onShortDialogShow()}
        onHide={() => onShortDialogHide()}
        visible={isShortFormVisible}
      >
        <ShortsForm short={null}
          onSubmitCallback={onNewShort}
          onClose={() => setIsShortFormVisible(false)}
          onDelete={() => setIsShortFormVisible(false)}
        />
      </Dialog>
      <div className="grid">
        <div className="flex flex-stretch field col-12 align-items-center justify-content-center">
          <div className="grid col-10 align-items-center justify-content-center">
            <span className="p-float-label mr-3">
              <AutoComplete
                field="name"
                delay={500}
                minLength={2}
                name="people"
                //value={filter}
                value={selectedPerson?.name}
                suggestions={filteredPeople}
                completeMethod={filterPeople}
                //onChange={(e) => setFilter(e.value.name)}
                onSelect={(e) => setSelectedPerson(e.value)}
                onClear={() => clearPerson()}
                itemTemplate={personTemplate}
              />
              <label htmlFor="people">Henkilö</label>
            </span>
            <span className="p-float-label mr-3">
              <Dropdown
                name="shorts"
                options={personShorts}
                value={selectedShort}
                onChange={(e) => setSelectedShort(e.value)}
                optionLabel="title"
                itemTemplate={dropDownShortTemplate}
                filter
                className="w-20rem"
              />
              <label htmlFor="shorts">Novellit</label>
            </span>
            <span>
              <Button onClick={addToSelected} disabled={selectedShort === null}>
                Lisää
              </Button>
            </span>
          </div>
          <div className="grid col-2 align-items-center justify-content-end">
            <Button onClick={() => setIsShortFormVisible(true)}>
              Uusi
            </Button>
          </div>
        </div>
        <div className="field col-12">
          {selectedItemShorts &&
            <OrderList dataKey="id" value={selectedItemShorts}
              onChange={(e) => setSelectedItemShorts(e.value)}
              itemTemplate={itemTemplate}
              dragdrop
            />
          }
        </div>
        <div className="field col-12">
          <Button
            className="w-full justify-content-center"
            onClick={() => onSave(selectedItemShorts)}
          >Tallenna</Button>
        </div>
      </div>
    </div>
  )
}
