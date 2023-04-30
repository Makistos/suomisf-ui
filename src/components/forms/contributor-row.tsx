import React, { useState, useEffect, useMemo } from "react";

import { Controller, useFieldArray, Control, UseFormRegister, FieldArrayWithId, useFormContext } from 'react-hook-form';
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Dropdown } from "primereact/dropdown";

import { Contribution, ContributionSimple } from "../../types/contribution";
import { getApiContent } from "../../services/user-service";
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
