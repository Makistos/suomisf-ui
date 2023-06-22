
import React from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { getCurrenUser } from '../../services/auth-service';


interface AwardsFieldProps {
  id: string,
  defValues?: any[],
  disabled: boolean
}

export const AwardsField = ({ id, defValues, disabled }: AwardsFieldProps) => {
  const user = getCurrenUser();

  return (
    <div>
    </div>
  )
}