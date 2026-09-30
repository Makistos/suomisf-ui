import React, { useEffect } from "react";

import { useFieldArray, Control, FieldArrayWithId } from 'react-hook-form';
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";

import { Contribution } from "../../types/contribution";
import { getCurrenUser } from "../../services/auth-service";
import { Contributor } from "../../types/contributor";
import { Contributable } from "../../types/generic";

interface ContributorFieldProps {
  id: string,
  item: Contributable,
  index: number,
  control: Control,
  defValues?: Contribution[],
  disabled: boolean,
  fieldCount: number,
}

type ContributorFieldPair = Pick<Contributor, "id" | "name">;
