export interface FormProperties<T> {
    data: T | null,
    onSubmitCallback: (() => void)
}
