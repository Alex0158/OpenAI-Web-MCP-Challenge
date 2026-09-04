export type QueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  refetch: () => void;
};

export type MutationResult<Input, Output = void> = {
  submit: (input: Input) => Promise<Output>;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  reset: () => void;
};
