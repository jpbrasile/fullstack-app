/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useEffect, useState } from "https://esm.sh/react@18.2.0";
import apiRequest from './api.js'; // Import the apiRequest function
import { renderForm, renderList } from './utils.js'; // Import render functions

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

  const handleInputChange = (setter) => (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if ((name === "prospect_id" || name === "entreprise_id") && value !== "") {
      parsedValue = parseInt(value, 10);
    }
    setter(prev => ({ ...prev, [name]: parsedValue }));
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
      let dataToSubmit = editState ? editState : newItemState;

      // **SOLUTION: For PUT requests (edit mode), specifically for prospects,
      // remove the 'entrepriseName' property before submitting.**
      if (method === "PUT" && activeTab === "prospects") {
        if (dataToSubmit.hasOwnProperty('entrepriseName')) {
          delete dataToSubmit.entrepriseName;
        }
      }

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
          {renderForm({
            state: newProspect,
            setState: setNewProspect,
            handleSubmitFn: handleSubmit(
              "/api/prospects",
              newProspect,
              resetNewProspect,
              setProspects,
              editProspect,
              setEditProspect
            ),
            fields: prospectFields,
            editState: editProspect
          })}
          {renderList({
            items: extendedProspects,
            fields: prospectFields,
            handleDelete: handleDelete,
            itemType: "prospect",
            editHandler: (item) => handleEdit(item, setEditProspect, resetNewProspect),
            editState: editProspect
          })}
        </div>
      )}
      {activeTab === "entreprises" && (
        <div>
          {renderForm({
            state: newEntreprise,
            setState: setNewEntreprise,
            handleSubmitFn: handleSubmit(
              "/api/entreprises",
              newEntreprise,
              resetNewEntreprise,
              setEntreprises,
              editEntreprise,
              setEditEntreprise
            ),
            fields: entrepriseFields,
            editState: editEntreprise
          })}
          {renderList({
            items: filteredEntreprises,
            fields: entrepriseFields,
            handleDelete: handleDelete,
            itemType: "entreprise",
            editHandler: (item) => handleEdit(item, setEditEntreprise, resetNewEntreprise),
            editState: editEntreprise
          })}
        </div>
      )}
      {activeTab === "taches" && (
        <div>
          {renderForm({
            state: newTache,
            setState: setNewTache,
            handleSubmitFn: handleSubmit(
              "/api/taches",
              newTache,
              resetNewTache,
              setTaches,
              editTache,
              setEditTache
            ),
            fields: tacheFields,
            editState: editTache
          })}
          {renderList({
            items: filteredTaches,
            fields: tacheFields,
            handleDelete: handleDelete,
            itemType: "tache",
            editHandler: (item) => handleEdit(item, setEditTache, resetNewTache),
            editState: editTache
          })}
        </div>
      )}
      {activeTab === "historique_emails" && (
        <div>
          {renderForm({
            state: newEmail,
            setState: setNewEmail,
            handleSubmitFn: handleSubmit(
              "/api/email_history",
              newEmail,
              resetNewEmail,
              setEmailHistory,
              editEmail,
              setEditEmail
            ),
            fields: emailFields,
            editState: editEmail
          })}
          {renderList({
            items: filteredEmails,
            fields: emailFields,
            handleDelete: handleDelete,
            itemType: "email",
            editHandler: (item) => handleEdit(item, setEditEmail, resetNewEmail),
            editState: editEmail
          })}
        </div>
      )}
      {activeTab === "historique_appels" && (
        <div>
          {renderForm({
            state: newCall,
            setState: setNewCall,
            handleSubmitFn: handleSubmit(
              "/api/call_history",
              newCall,
              resetNewCall,
              setCallHistory,
              editCall,
              setEditCall
            ),
            fields: callFields,
            editState: editCall
          })}
          {renderList({
            items: filteredCalls,
            fields: callFields,
            handleDelete: handleDelete,
            itemType: "appel",
            editHandler: (item) => handleEdit(item, setEditCall, resetNewCall),
            editState: editCall
          })}
        </div>
      )}
      {activeTab === "historique_meetings" && (
        <div>
          {renderForm({
            state: newMeeting,
            setState: setNewMeeting,
            handleSubmitFn: handleSubmit(
              "/api/meetings",
              newMeeting,
              resetNewMeeting,
              setMeetings,
              editMeeting,
              setEditMeeting
            ),
            fields: meetingFields,
            editState: editMeeting
          })}
          {renderList({
            items: filteredMeetings,
            fields: meetingFields,
            handleDelete: handleDelete,
            itemType: "meeting",
            editHandler: (item) => handleEdit(item, setEditMeeting, resetNewMeeting),
            editState: editMeeting
          })}
        </div>
      )}
    </div>
  );
}

export default App;