import { CircleAlert } from "lucide-react";
import { getErrorList, getErrorMessage } from "../utils/api.js";

export function ErrorAlert({ error, title = "Something went wrong", actionLabel, onAction }) {
  if (!error) {
    return null;
  }

  const errorList = getErrorList(error);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1">{getErrorMessage(error)}</p>
          {errorList.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
