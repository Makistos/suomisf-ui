/**
 * Control that allows user to pick shorts for an edition or work.
 *
 * Contains a control for picking author and a when selected, fills another
 * with shorts written by that author.
 *
 * Main control shows the shorts for the selected edition or work. This list
 * can be edited by adding or removing items and by reordering them.
 */
import { useEffect, useState } from "react";

import { AutoComplete } from "primereact/autocomplete";
import { OrderList } from "primereact/orderlist"
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";

import { getCurrenUser } from "../../../services/auth-service";
import { Person } from "../../person";
import { Short } from "../types";
import { useFilterPeople } from "../../../hooks/use-people-filter"
import { getApiContent, putApiContent } from "../../../services/user-service";
import { Button } from "primereact/button";
import { isAdmin } from "../../user";
import { ShortsForm } from "./shorts-form";
import { useQueryClient } from "@tanstack/react-query";

type PickerProps = {
  id: string,
  onClose: () => void,
}

export const EditionShortsPicker = ({ id }: PickerProps) => {
  const user = getCurrenUser();
  const [shorts, setShorts] = useState<Short[]>([]);

  console.log("foo")
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
    // console.log(response)
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
  const user = getCurrenUser();
  const [shorts, setShorts] = useState<Short[]>([]);
  const isDirty = false;
  const queryClient = useQueryClient();

  console.log("foo")
  useEffect(() => {
    const getWorkShorts = async () => {
      const response = await getApiContent('works/shorts/' + id.toString(), user);
      setShorts(response.data);
      console.log(response.data)
    }
    if (id && !isDirty) {
      getWorkShorts();
    }
  }, [])

  const saveShortsToWork = (shorts: Short[]): number => {
    const ids = shorts.map(short => short.id)
    const data = { work_id: id, shorts: ids }
    const response = putApiContent('works/shorts', data, user);
    // console.log(response)
    onClose();
    return 200
  }

  // console.log(shorts)

  return (
    <>
      <ShortsPicker source={shorts}
        saveCallback={saveShortsToWork}
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
  const [selectedPerson, setSelectedPerson] = useState<Person | string | null>(null);
  // Shorts written by selected person
  const [personShorts, setPersonShorts] = useState<Short[]>([]);
  // Shorts that have been selected for this item
  const [selectedItemShorts, setSelectedItemShorts] = useState<Short[]>([]);
  // Short selected in the dropdown
  const [selectedShort, setSelectedShort] = useState<Short | null>(null);
  // People matching search query
  const [filteredPeople, filterPeople] = useFilterPeople();
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

  const addToSelected = () => {
    if (selectedShort === null) {
      return;
    }
    const newShorts = [...selectedItemShorts, selectedShort];
    setSelectedItemShorts(newShorts);
    setHasChanged(true);
  }

  const removeFromSelected = (id: number) => {
    const newShorts = selectedItemShorts.filter(short => short.id !== id);
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
    // const short = JSON.parse(response);
    const newShorts: Short[] = selectedItemShorts;
    newShorts.push(response);
    setSelectedItemShorts(newShorts);
    setHasChanged(true);
    setIsShortFormVisible(visible);
  }

  const onSave = (shorts: Short[]) => {
    saveCallback(shorts);
  }

  console.log(selectedItemShorts)

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
        />
      </Dialog>
      <div className="grid">
        <div className="flex flex-stretch field col-12 align-items-center justify-content-center">
          <div className="grid col-10 align-items-center justify-content-center">
            <span className="p-float-label mr-3">
              <AutoComplete
                field="name"
                delay={300}
                minLength={2}
                name="people"
                value={filter}
                suggestions={filteredPeople}
                completeMethod={filterPeople}
                onChange={(e) => setFilter(e.value)}
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
