
export const formErrorMessage = (name: string, errors: any) => {
  const message = errors[name];
  const error = message?.message;
  return error ? <small className="p-error">{error.toString()}</small> :
    <small className="p-error">&nbsp;</small>
}
