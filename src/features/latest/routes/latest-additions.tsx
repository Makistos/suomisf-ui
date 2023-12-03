import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Dropdown } from "primereact/dropdown";
import { WorksLatest } from "../../work/components/works-latest";
import { EditionsLatest } from "../../edition/components/editions-latest";
import { PeopleLatest } from "../../person/components/people-latest";
import { ShortsLatest } from "../../short/components/shorts-latest";
import { CoversLatest } from "../../images/components/covers-latest";

export const LatestAdditions = () => {
  const [target, setTarget] = useState('works');
  const [count, setCount] = useState('10');

  const targets = [
    { name: 'Painokset', code: 'editions' },
    { name: 'Teokset', code: 'works' },
    { name: 'Novellit', code: 'shorts' },
    { name: 'Henkilöt', code: 'people' },
    { name: 'Kannet', code: 'covers' }
  ];

  const showcounts = [
    { name: '10', code: '10', },
    { name: '20', code: '20' },
    { name: '50', code: '50' },
    { name: '100', code: '100' }
  ];

  return (
    <main className="all-content">
      <div className="grid justify-content-center">
        <div className="grid col-12 justify-content-center pt-5">
          <h1 className="maintitle">Viimeisimmät lisäykset</h1>
        </div>
        <div className="grid col-12 justify-content-center mt-5">
          <div className="mr-2">
            <Dropdown
              options={targets}
              value={target}
              optionLabel="name"
              optionValue="code"
              onChange={(e) => setTarget(e.value)}
            />
          </div>
          <div>
            <Dropdown
              options={showcounts}
              value={count}
              placeholder="Luk"
              optionLabel="name"
              optionValue="code"
              onChange={(e) => setCount(e.value)}
            />
          </div>
        </div>
        <div className="mt-5">
          {target === 'works' && <WorksLatest count={count} />}
          {target === 'editions' && <EditionsLatest count={count} />}
          {target === 'people' && <PeopleLatest count={count} />}
          {target === 'shorts' && <ShortsLatest count={count} />}
          {target === 'covers' && <CoversLatest count={count} />}
        </div>
      </div>
    </main >
  )
}