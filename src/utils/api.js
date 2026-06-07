export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? null;
    this.errors = options.errors ?? [];
    this.data = options.data;
  }
}

export function getErrorList(error) {
  if (!error) {
    return [];
  }

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.message || item?.msg || JSON.stringify(item);
    });
  }

  return [];
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  return error?.message || fallback;
}
