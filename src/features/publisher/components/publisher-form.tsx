import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues, useFieldArray } from 'react-hook-form';

import { getApiContent, putApiContent } from '../../../services/user-service';
import { isDisabled } from '../../../components/forms/forms';

type FormData = {
  [index: string]: any,
  name: string,
  fullname?: string,
  description: string
}
export const PublisherForm = () => {
  return (
    <div>

    </div>
  )
}