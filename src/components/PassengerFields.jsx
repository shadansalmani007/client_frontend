export function PassengerFields({ fields, register, errors }) {
  if (!fields.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <input
            type="hidden"
            {...register(`passengers.${index}.seatNumber`, {
              required: "Seat number is required.",
            })}
          />
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Passenger for seat {field.seatNumber}</h4>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="form-label">Passenger Name</label>
              <input
                type="text"
                className="form-input"
                {...register(`passengers.${index}.passengerName`, {
                  required: "Passenger name is required.",
                })}
              />
              {errors?.passengers?.[index]?.passengerName ? (
                <p className="form-error">
                  {errors.passengers[index].passengerName.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                {...register(`passengers.${index}.passengerAge`, {
                  required: "Passenger age is required.",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Age must be at least 1.",
                  },
                  max: {
                    value: 120,
                    message: "Age must be 120 or below.",
                  },
                })}
              />
              {errors?.passengers?.[index]?.passengerAge ? (
                <p className="form-error">
                  {errors.passengers[index].passengerAge.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="form-label">Gender</label>
              <select
                className="form-input"
                {...register(`passengers.${index}.passengerGender`, {
                  required: "Passenger gender is required.",
                })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors?.passengers?.[index]?.passengerGender ? (
                <p className="form-error">
                  {errors.passengers[index].passengerGender.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
