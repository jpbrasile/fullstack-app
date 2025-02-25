// utils.js
import React from 'https://esm.sh/react@18.2.0';

export const renderForm = ({ state, setState, handleSubmitFn, fields, editState = null }) => {
  const isEditing = !!editState;

  // Create a simple input change handler that works for both modes
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if ((name === "prospect_id" || name === "entreprise_id") && value !== "") {
      parsedValue = parseInt(value, 10);
    }

    // When editing, update editState directly using functional setState
    // to ensure a new object is created based on the previous state.
    if (isEditing) {
      setState(prevState => {
        return { ...prevState, [name]: parsedValue };
      });
    } else {
      setState(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  return (
    <form onSubmit={handleSubmitFn} className="mb-4">
      {fields.map((field) => {
        const { name, label, type, options, required = true, readOnly = false } = field;

        // Get the appropriate value based on mode
        const value = isEditing ? (editState[name] ?? "") : (state[name] ?? "");

        return (
          <div key={name} className="mb-2">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            {readOnly ? (
              <input
                id={name}
                type="text"
                name={name}
                value={value}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
            ) : type === "textarea" ? (
              <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChangeHandler}
                required={required}
                className="w-full p-2 border rounded"
              />
            ) : type === "select" ? (
              <select
                id={name}
                name={name}
                value={String(value)}
                onChange={onChangeHandler}
                required={required}
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionnez une option</option>
                {options && options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChangeHandler}
                placeholder={label}
                required={required}
                className="w-full p-2 border rounded"
              />
            )}
          </div>
        );
      })}
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {isEditing ? "Mettre à jour" : "Ajouter"}
      </button>
      {isEditing && (
        <button
          type="button"
          onClick={() => setState(null)}
          className="w-full mt-2 p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Annuler
        </button>
      )}
    </form>
  );
};

export const renderList = ({ items, fields, handleDelete, itemType, editHandler, editState }) => (
  <ul>
    {items.map((item) => {
      return (
        <li key={item[`${itemType}_id`] || item.id} className="mb-2 p-2 bg-gray-100 rounded">
          {fields.map((field) => {
            let displayValue = item[field.name] ?? "N/A";

            // Display enterprise name instead of ID
            if (field.name === "entreprise_id" && itemType === "prospect") {
              displayValue = item.entrepriseName || "N/A";
            }

            // Display prospect name instead of ID
            if (field.name === "prospect_id" && itemType !== "prospect") {
              displayValue = item.prospectFullName || "N/A";
            }

            return (
              <span key={field.name}>
                {field.label}: {displayValue} <br />
              </span>
            );
          })}
          <div className="inline-flex space-x-2">
            <button
              onClick={() => editHandler(item)}
              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Modifier
            </button>
            <button
              onClick={handleDelete(`/api/${itemType}s`, item[`${itemType}_id`] || item.id)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Supprimer
            </button>
          </div>
        </li>
      );
    })}
  </ul>
);