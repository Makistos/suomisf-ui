import { User } from '../../user/types';

export interface LogItem {
  id: number;
  table_name: string;
  field_name: string;
  table_id: number;
  object_name: string;
  action: string;
  user_id: number;
  old_value: string;
  date: string;
  user: User;
}