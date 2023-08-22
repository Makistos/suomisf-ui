import { Controller, UseFormReturn } from "react-hook-form"
import { Editor, EditorProps } from "primereact/editor"
import { classNames } from 'primereact/utils'

interface FormEditorProps extends EditorProps {
  name: string,
  methods: UseFormReturn,
  style?: React.CSSProperties,
  disabled: boolean
}

export const FormEditor = ({ name, methods, style, disabled, ...rest }: FormEditorProps) => {
  return (
    <Controller
      name={name}
      control={methods.control}
      render={({ field, fieldState }) => (
        <Editor
          id={field.name}
          {...field}
          style={style}
          readOnly={disabled}
          onTextChange={(e) => field.onChange(e.htmlValue)}
          {...rest}
          value={field.value}
          name={name}
        />
      )}
    />
  )
}