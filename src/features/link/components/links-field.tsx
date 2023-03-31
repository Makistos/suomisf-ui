import { useState, useEffect, useMemo } from "react";

import { Controller, useFieldArray, Control, UseFormRegister, FieldArrayWithId, FieldValues } from 'react-hook-form';

import { LinkType } from '../../../types/link';
import { getCurrenUser } from "../../../services/auth-service";

interface LinksFieldProps {
  id: string,
  control: Control,
  defValues?: LinkType[],
  item_id: number,
  disabled: boolean
}

export const LinksField = <T extends unknown>({
  id,
  control,
  defValues,
  item_id,
  disabled
}: LinksFieldProps) => {
  const user = useMemo(() => { return getCurrenUser() }, []);

  const emptyLink: LinkType = {
    id: null,
    item_id: item_id,
    link: '',
    description: ''
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links"
  })

  const LinksRow = (item: LinkType, index: number) => {
    return (
      <div></div>
    )
  }

  return (
    <>
      <span>
        <label htmlFor="links" className="form-field-header">Linkit</label>
        {/* <div id="links" className="py-0">
          {fields && fields.map((item: FieldArrayWithId<T, "links", "id">, index: number) =>
            LinksRow(item, index))
          }
        </div> */}
      </span>
    </>
  )
}