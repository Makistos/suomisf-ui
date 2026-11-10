import { User } from '../../user/types';

export interface LogItem {
  id: number;
  table_name: string;
  field_name: string;
  table_id: number;
  object_name: string;
  action: string;
  user_id: number;
  old_value: string | null;
  date: string;
  user: User | null;
  /** Current name of the field (old names are mapped); work history only. */
  field?: string;
  /** Value the change set, derived by the backend; null if unknown. */
  new_value?: string | null;
  /** "next": the next change's old value; "current": the current value. */
  new_value_source?: 'next' | 'current' | null;
  /** "Teos", or an edition such as "2. painos (1995)". */
  target?: string;
}
