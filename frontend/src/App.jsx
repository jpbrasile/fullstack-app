/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useEffect, useState } from "https://esm.sh/react@18.2.0";

// Utility function for consistent API requests
async function apiRequest(url, method = "GET", data = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorBody = "";
    let errorMessage = `API request to ${url} failed: ${response.status} ${response.statusText}`;
    try {
      errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage += ` - ${errorBody.message}`;
      } else {
        errorBody = await response.text();
        errorMessage += ` - ${errorBody}`;
      }
    } catch (e) {
      errorBody = "Unable to read response body";
      errorMessage += ` - ${errorBody}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

function App() {
  const [activeTab, setActiveTab] = useState("prospects");
  const [prospects, setProspects] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [taches, setTaches] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // --- State for editing ---
  const [editProspect, setEditProspect] = useState(null);
  const [editEntreprise, setEditEntreprise] = useState(null);
  const [editTache, setEditTache] = useState(null);
  const [editEmail, setEditEmail] = useState(null);
  const [editCall, setEditCall] = useState(null);
  const [editMeeting, setEditMeeting] = useState(null);

  // --- State for new items, using a consistent naming convention ---  
  // For prospects we keep nom and prenom; for related records, use prospect_id.
  const [newProspect, setNewProspect] = useState({
    nom: "",
    prenom: "",
    entreprise_id: "",
    email: "",
    telephone: "",
    fonction: "",
    notes: "",
  });
  const [newEntreprise, setNewEntreprise] = useState({
    nom_entreprise: "",
    secteur_activite: "",
    taille_entreprise: "",
    adresse: "",
    site_web: "",
    strategie_entreprise: "",
    notes: "",
  });
  const [newTache, setNewTache] = useState({
    libelle: "",
    status: "",
    date_objectif: "",
    notes: "",
    prospect_id: "",
  });
  const [newEmail, setNewEmail] = useState({
    prospect_id: "",
    date_email: "",
    expediteur: "",
    destinataire: "",
    sujet: "",
    corps: "",
  });
  const [newCall, setNewCall] = useState({
    prospect_id: "",
    date_appel: "",
    notes: "",
  });
  const [newMeeting, setNewMeeting] = useState({
    prospect_id: "",
    date_meeting: "",
    participants: "",
    notes: "",
  });

  const resetNewProspect = () =>
    setNewProspect({
      nom: "",
      prenom: "",
      entreprise_id: "",
      email: "",
      telephone: "",
      fonction: "",
      notes: "",
    });
  const resetNewEntreprise = () =>
    setNewEntreprise({
      nom_entreprise: "",
      secteur_activite: "",
      taille_entreprise: "",
      adresse: "",
      site_web: "",
      strategie_entreprise: "",
      notes: "",
    });
  const resetNewTache = () =>
    setNewTache({
      libelle: "",
      status: "",
      date_objectif: "",
      notes: "",
      prospect_id: "",
    });
  const resetNewEmail = () =>
    setNewEmail({
      prospect_id: "",
      date_email: "",
      expediteur: "",
      destinataire: "",
      sujet: "",
      corps: "",
    });
  const resetNewCall = () =>
    setNewCall({
      prospect_id: "",
      date_appel: "",
      notes: "",
    });
  const resetNewMeeting = () =>
    setNewMeeting({
      prospect_id: "",
      date_meeting: "",
      participants: "",
      notes: "",
    });

  const fetchData = async () => {
    try {
      if (activeTab === "prospects" || activeTab === "taches" || 
          activeTab === "historique_emails" || activeTab === "historique_appels" || 
          activeTab === "historique_meetings") {
        setProspects(await apiRequest("/api/prospects"));
      }
      
      // Always fetch enterprises for dropdown menus
      const entreprisesData = await apiRequest("/api/entreprises");
      setEntreprises(entreprisesData);
      
      if (activeTab === "taches") {
        setTaches(await apiRequest("/api/taches"));
      }
      if (activeTab === "historique_emails") {
        setEmailHistory(await apiRequest("/api/email_history"));
      }
      if (activeTab === "historique_appels") {
        setCallHistory(await apiRequest("/api/call_history"));
      }
      if (activeTab === "historique_meetings") {
        setMeetings(await apiRequest("/api/meetings"));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleInputChange = (setter, isEdit = false) => (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if ((name === "prospect_id" || name === "entreprise_id") && value !== "") {
      parsedValue = parseInt(value, 10);
    }
    setter((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const filterData = (data, keys) => {
    if (!filter) return data;
    return data.filter((item) =>
      keys.some((key) => String(item[key] ?? "").toLowerCase().includes(filter.toLowerCase()))
    );
  };

  const handleSubmit = (apiEndpoint, newItemState, reset, setData, editState = null, setEditState = null) => async (e) => {
    e.preventDefault();
    try {
      const method = editState ? "PUT" : "POST";
      const url = editState
        ? `${apiEndpoint}/${
            editState.prospect_id ||
            editState.entreprise_id ||
            editState.tache_id ||
            editState.email_id ||
            editState.appel_id ||
            editState.meeting_id ||
            editState.id
          }`
        : apiEndpoint;
  
      // When editing, use the current edited state, not the original
      const dataToSubmit = editState ? editState : newItemState;
  
      await apiRequest(url, method, dataToSubmit);
      await fetchData();
      reset();
      if (setEditState) {
        setEditState(null);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert(`Error submitting data: ${error.message}`);
    }
  };

  const handleDelete = (apiEndpoint, id) => async () => {
    try {
      await apiRequest(`${apiEndpoint}/${id}`, "DELETE");
      fetchData();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert(`Error deleting data: ${error.message}`);
    }
  };

  const handleEdit = (item, setEdit, resetNew) => {
    resetNew();
    const itemToEdit = { ...item };
    if (itemToEdit.date_objectif)
      itemToEdit.date_objectif = itemToEdit.date_objectif.split("T")[0];
    if (itemToEdit.date_email)
      itemToEdit.date_email = new Date(itemToEdit.date_email).toISOString().slice(0, 16);
    if (itemToEdit.date_appel)
      itemToEdit.date_appel = new Date(itemToEdit.date_appel).toISOString().slice(0, 16);
    if (itemToEdit.date_meeting)
      itemToEdit.date_meeting = new Date(itemToEdit.date_meeting).toISOString().slice(0, 16);
    setEdit(itemToEdit);
  };

  // Find enterprise name by ID
  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find(e => e.entreprise_id === id);
    return entreprise ? entreprise.nom_entreprise : "N/A";
  };

  const filteredProspects = filterData(prospects, ["nom", "prenom", "email"]);
  const filteredEntreprises = filterData(entreprises, ["nom_entreprise", "secteur_activite", "adresse"]);

  // Add enterprise name to prospects for display
  const extendedProspects = filteredProspects.map(prospect => ({
    ...prospect,
    entrepriseName: getEntrepriseName(prospect.entreprise_id)
  }));

  // When rendering tasks, we want to join the prospect info.
  const extendedTaches = taches.map((tache) => {
    const prospect = prospects.find((p) => p.prospect_id === tache.prospect_id);
    return {
      ...tache,
      prospectFullName: prospect ? `${prospect.nom} ${prospect.prenom}` : "",
    };
  });
  
  let filteredTaches = extendedTaches;
  if (filterDate) {
    filteredTaches = filteredTaches.filter(
      (tache) => tache.date_objectif && tache.date_objectif >= filterDate
    );
  }
  filteredTaches = filterData(filteredTaches, ["libelle", "status", "notes", "prospectFullName"]);
  
  // Add prospect names to other lists
  const extendedEmails = emailHistory.map(email => {
    const prospect = prospects.find(p => p.prospect_id === email.prospect_id);
    return {
      ...email,
      prospectFullName: prospect ? `${prospect.nom} ${prospect.prenom}` : "N/A"
    };
  });
  
  const extendedCalls = callHistory.map(call => {
    const prospect = prospects.find(p => p.prospect_id === call.prospect_id);
    return {
      ...call,
      prospectFullName: prospect ? `${prospect.nom} ${prospect.prenom}` : "N/A"
    };
  });
  
  const extendedMeetings = meetings.map(meeting => {
    const prospect = prospects.find(p => p.prospect_id === meeting.prospect_id);
    return {
      ...meeting,
      prospectFullName: prospect ? `${prospect.nom} ${prospect.prenom}` : "N/A"
    };
  });
  
  const filteredEmails = filterData(extendedEmails, ["sujet", "expediteur", "destinataire", "corps", "prospectFullName"]);
  const filteredCalls = filterData(extendedCalls, ["notes", "prospectFullName"]);
  const filteredMeetings = filterData(extendedMeetings, ["notes", "participants", "prospectFullName"]);

  const renderForm = (state, setState, handleSubmit, fields, editState = null) => {
    const isEditing = !!editState;
    const currentState = isEditing ? editState : state;
    
    return (
      <form onSubmit={handleSubmit} className="mb-4">
        {fields.map((field) => {
          const { name, label, type, options, required = true, readOnly = false } = field;
          const value = currentState[name] ?? "";
          
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
                  onChange={handleInputChange(isEditing ? setState : setState)}
                  required={required}
                  className="w-full p-2 border rounded"
                />
              ) : type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={String(value)}
                  onChange={handleInputChange(isEditing ? setState : setState)}
                  required={required}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sélectionnez une option</option>
                  {options.map((option) => (
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
                  onChange={handleInputChange(isEditing ? setState : setState)}
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

  const renderList = (items, fields, handleDelete, itemType, editHandler, editState) => (
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

  const prospectFields = [
    { name: "prospect_id", label: "ID", type: "text", required: false, readOnly: true },
    { name: "nom", label: "Nom", type: "text" },
    { name: "prenom", label: "Prénom", type: "text" },
    {
      name: "entreprise_id",
      label: "Entreprise",
      type: "select",
      options: entreprises.map((e) => ({
        value: e.entreprise_id,
        label: e.nom_entreprise,
      })),
    },
    { name: "email", label: "Email", type: "email" },
    { name: "telephone", label: "Téléphone", type: "tel" },
    { name: "fonction", label: "Fonction", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const entrepriseFields = [
    { name: "entreprise_id", label: "ID", type: "text", required: false, readOnly: true },
    { name: "nom_entreprise", label: "Nom de l'entreprise", type: "text" },
    { name: "secteur_activite", label: "Secteur d'activité", type: "text" },
    { name: "taille_entreprise", label: "Taille de l'entreprise", type: "text" },
    { name: "adresse", label: "Adresse", type: "text" },
    { name: "site_web", label: "Site web", type: "text" },
    { name: "strategie_entreprise", label: "Stratégie de l'entreprise", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  // For tasks, emails, calls, and meetings, use prospect_id
  const tacheFields = [
    { name: "tache_id", label: "ID", type: "text", required: false, readOnly: true },
    { name: "libelle", label: "Libellé", type: "text" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "À faire", label: "À faire" },
        { value: "En cours", label: "En cours" },
        { value: "Terminé", label: "Terminé" },
      ],
    },
    { name: "date_objectif", label: "Date Objectif", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
    {
      name: "prospect_id",
      label: "Prospect",
      type: "select",
      options: prospects.map((p) => ({
        value: p.prospect_id,
        label: `${p.nom} ${p.prenom}`,
      })),
    },
  ];

  const emailFields = [
    { name: "email_id", label: "ID", type: "text", required: false, readOnly: true },
    {
      name: "prospect_id",
      label: "Prospect",
      type: "select",
      options: prospects.map((p) => ({
        value: p.prospect_id,
        label: `${p.nom} ${p.prenom}`,
      })),
    },
    { name: "date_email", label: "Date Email", type: "datetime-local" },
    { name: "expediteur", label: "Expéditeur", type: "text" },
    { name: "destinataire", label: "Destinataire", type: "text" },
    { name: "sujet", label: "Sujet", type: "text" },
    { name: "corps", label: "Corps", type: "textarea" },
  ];

  const callFields = [
    { name: "appel_id", label: "ID", type: "text", required: false, readOnly: true },
    {
      name: "prospect_id",
      label: "Prospect",
      type: "select",
      options: prospects.map((p) => ({
        value: p.prospect_id,
        label: `${p.nom} ${p.prenom}`,
      })),
    },
    { name: "date_appel", label: "Date Appel", type: "datetime-local" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const meetingFields = [
    { name: "meeting_id", label: "ID", type: "text", required: false, readOnly: true },
    {
      name: "prospect_id",
      label: "Prospect",
      type: "select",
      options: prospects.map((p) => ({
        value: p.prospect_id,
        label: `${p.nom} ${p.prenom}`,
      })),
    },
    { name: "date_meeting", label: "Date Meeting", type: "datetime-local" },
    { name: "participants", label: "Participants", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Gestion de Prospects et Entreprises</h1>
      <div className="mb-4">
        <button
          className={`px-4 py-2 mr-2 ${
            activeTab === "prospects" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("prospects")}
        >
          Prospects
        </button>
        <button
          className={`px-4 py-2 mr-2 ${
            activeTab === "entreprises" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("entreprises")}
        >
          Entreprises
        </button>
        <button
          className={`px-4 py-2 mr-2 ${
            activeTab === "taches" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("taches")}
        >
          Tâches
        </button>
        <button
          className={`px-4 py-2 mr-2 ${
            activeTab === "historique_emails" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("historique_emails")}
        >
          Historique Emails
        </button>
        <button
          className={`px-4 py-2 mr-2 ${
            activeTab === "historique_appels" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("historique_appels")}
        >
          Historique Appels
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "historique_meetings" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("historique_meetings")}
        >
          Historique Meetings
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher..."
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          placeholder="Filtrer par date"
          className="w-full p-2 border rounded"
        />
      </div>

      {activeTab === "prospects" && (
        <div>
          {renderForm(
            newProspect,
            setNewProspect,
            handleSubmit(
              "/api/prospects",
              newProspect,
              resetNewProspect,
              setProspects,
              editProspect,
              setEditProspect
            ),
            prospectFields,
            editProspect
          )}
          {renderList(
            extendedProspects,
            prospectFields,
            handleDelete,
            "prospect",
            (item) => handleEdit(item, setEditProspect, resetNewProspect),
            editProspect
          )}
        </div>
      )}
      {activeTab === "entreprises" && (
        <div>
          {renderForm(
            newEntreprise,
            setNewEntreprise,
            handleSubmit(
              "/api/entreprises",
              newEntreprise,
              resetNewEntreprise,
              setEntreprises,
              editEntreprise,
              setEditEntreprise
            ),
            entrepriseFields,
            editEntreprise
          )}
          {renderList(
            filteredEntreprises,
            entrepriseFields,
            handleDelete,
            "entreprise",
            (item) => handleEdit(item, setEditEntreprise, resetNewEntreprise),
            editEntreprise
          )}
        </div>
      )}
      {activeTab === "taches" && (
        <div>
          {renderForm(
            newTache,
            setNewTache,
            handleSubmit(
              "/api/taches",
              newTache,
              resetNewTache,
              setTaches,
              editTache,
              setEditTache
            ),
            tacheFields,
            editTache
          )}
          {renderList(
            filteredTaches,
            tacheFields,
            handleDelete,
            "tache",
            (item) => handleEdit(item, setEditTache, resetNewTache),
            editTache
          )}
        </div>
      )}
      {activeTab === "historique_emails" && (
        <div>
          {renderForm(
            newEmail,
            setNewEmail,
            handleSubmit(
              "/api/email_history",
              newEmail,
              resetNewEmail,
              setEmailHistory,
              editEmail,
              setEditEmail
            ),
            emailFields,
            editEmail
          )}
          {renderList(
            filteredEmails,
            emailFields,
            handleDelete,
            "email",
            (item) => handleEdit(item, setEditEmail, resetNewEmail),
            editEmail
          )}
        </div>
      )}
      {activeTab === "historique_appels" && (
        <div>
          {renderForm(
            newCall,
            setNewCall,
            handleSubmit(
              "/api/call_history",
              newCall,
              resetNewCall,
              setCallHistory,
              editCall,
              setEditCall
            ),
            callFields,
            editCall
          )}
          {renderList(
            filteredCalls,
            callFields,
            handleDelete,
            "appel",
            (item) => handleEdit(item, setEditCall, resetNewCall),
            editCall
          )}
        </div>
      )}
      {activeTab === "historique_meetings" && (
        <div>
          {renderForm(
            newMeeting,
            setNewMeeting,
            handleSubmit(
              "/api/meetings",
              newMeeting,
              resetNewMeeting,
              setMeetings,
              editMeeting,
              setEditMeeting
            ),
            meetingFields,
            editMeeting
          )}
          {renderList(
            filteredMeetings,
            meetingFields,
            handleDelete,
            "meeting",
            (item) => handleEdit(item, setEditMeeting, resetNewMeeting),
            editMeeting
          )}
        </div>
      )}
    </div>
  );
}

export default App;