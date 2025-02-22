export default async function server(request) {
  const { sqlite } = await import("https://esm.town/v/stevekrouse/sqlite");
  const SCHEMA_VERSION = 5; // Bump schema version whenever database structure changes
  const KEY = new URL(import.meta.url).pathname.split("/").at(-1);

  // Initialize database WITH CASCADING DELETES
  try {
    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_entreprises_${SCHEMA_VERSION} (
        entreprise_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_entreprise TEXT NOT NULL,
        secteur_activite TEXT,
        taille_entreprise TEXT,
        adresse TEXT,
        site_web TEXT,
        strategie_entreprise TEXT,
        notes TEXT,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_prospects_${SCHEMA_VERSION} (
        prospect_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        entreprise_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        telephone TEXT,
        fonction TEXT,
        notes TEXT,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entreprise_id) REFERENCES ${KEY}_entreprises_${SCHEMA_VERSION}(entreprise_id) ON DELETE CASCADE
      )
    `);

    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_historique_appels_${SCHEMA_VERSION} (
        appel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER,
        date_appel TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (prospect_id) REFERENCES ${KEY}_prospects_${SCHEMA_VERSION}(prospect_id) ON DELETE CASCADE
      )
    `);

    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_historique_emails_${SCHEMA_VERSION} (
        email_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER,
        date_email TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expediteur TEXT,
        destinataire TEXT,
        sujet TEXT,
        corps TEXT,
        FOREIGN KEY (prospect_id) REFERENCES ${KEY}_prospects_${SCHEMA_VERSION}(prospect_id) ON DELETE CASCADE
      )
    `);

    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_historique_meetings_${SCHEMA_VERSION} (
        meeting_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER,
        date_meeting TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        participants TEXT,
        notes TEXT,
        FOREIGN KEY (prospect_id) REFERENCES ${KEY}_prospects_${SCHEMA_VERSION}(prospect_id) ON DELETE CASCADE
      )
    `);

    await sqlite.execute(`
      CREATE TABLE IF NOT EXISTS ${KEY}_taches_${SCHEMA_VERSION} (
        tache_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER,
        libelle TEXT,
        status TEXT,
        date_objectif DATE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (prospect_id) REFERENCES ${KEY}_prospects_${SCHEMA_VERSION}(prospect_id) ON DELETE CASCADE
      )
    `);
  } catch (error) {
    console.error("Error initializing database:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
  const url = new URL(request.url);
  const path = url.pathname;

  // Helper function to execute SQL within a transaction
  async function executeTransaction(queries) {
    try {
      await sqlite.execute("BEGIN TRANSACTION");
      for (const { sql, params } of queries) {
        await sqlite.execute(sql, params);
      }
      await sqlite.execute("COMMIT");
      return { success: true };
    } catch (error) {
      await sqlite.execute("ROLLBACK");
      console.error("Transaction error:", error);
      throw error;
    }
  }
  try {
    if (path === "/api/prospects" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_prospects_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/entreprises" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_entreprises_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/taches" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_taches_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/email_history" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_historique_emails_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/call_history" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_historique_appels_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/meetings" && request.method === "GET") {
      const result = await sqlite.execute(`SELECT * FROM ${KEY}_historique_meetings_${SCHEMA_VERSION}`);
      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/prospects" && request.method === "POST") {
      const { nom, prenom, entreprise_id, email, telephone, fonction, notes } = await request.json();

      // Check if entreprise_id exists
      if (entreprise_id) {
        const entrepriseCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_entreprises_${SCHEMA_VERSION} WHERE entreprise_id = ?`,
          [entreprise_id],
        );
        if (entrepriseCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Entreprise ID '${entreprise_id}' does not exist. Please select a valid Entreprise.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      await sqlite.execute(
        `INSERT INTO ${KEY}_prospects_${SCHEMA_VERSION} (nom, prenom, entreprise_id, email, telephone, fonction, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom, entreprise_id, email, telephone, fonction, notes],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    // --- PUT (Update) Routes ---
    if (path.startsWith("/api/prospects/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10); // Parse ID as integer
      const { nom, prenom, entreprise_id, email, telephone, fonction, notes } = await request.json();

      // Check if entreprise_id exists
      if (entreprise_id) {
        const entrepriseCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_entreprises_${SCHEMA_VERSION} WHERE entreprise_id = ?`,
          [entreprise_id],
        );
        if (entrepriseCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Entreprise ID '${entreprise_id}' does not exist. Please select a valid Entreprise.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      // Construct the SQL UPDATE statement.  Critical for security, and updates only provided fields.
      const updates = [];
      const values = [];

      if (nom !== undefined) {
        updates.push("nom = ?");
        values.push(nom);
      }
      if (prenom !== undefined) {
        updates.push("prenom = ?");
        values.push(prenom);
      }
      if (entreprise_id !== undefined) {
        updates.push("entreprise_id = ?");
        values.push(entreprise_id);
      }
      if (email !== undefined) {
        updates.push("email = ?");
        values.push(email);
      }
      if (telephone !== undefined) {
        updates.push("telephone = ?");
        values.push(telephone);
      }
      if (fonction !== undefined) {
        updates.push("fonction = ?");
        values.push(fonction);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        values.push(notes);
      }

      updates.push("date_mise_a_jour = CURRENT_TIMESTAMP"); // Always update timestamp

      if (updates.length === 0) { // Don't update if no fields were provided.
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sql = `UPDATE ${KEY}_prospects_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE prospect_id = ?`;
      values.push(id); // Add the ID to the end of values array.

      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/entreprises" && request.method === "POST") {
      const { nom_entreprise, secteur_activite, taille_entreprise, adresse, site_web, strategie_entreprise, notes } =
        await request.json();

      await sqlite.execute(
        `INSERT INTO ${KEY}_entreprises_${SCHEMA_VERSION} (nom_entreprise, secteur_activite, taille_entreprise, adresse, site_web, strategie_entreprise, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom_entreprise, secteur_activite, taille_entreprise, adresse, site_web, strategie_entreprise, notes],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/entreprises/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10);
      const { nom_entreprise, secteur_activite, taille_entreprise, adresse, site_web, strategie_entreprise, notes } =
        await request.json();

      const updates = [];
      const values = [];

      if (nom_entreprise !== undefined) {
        updates.push("nom_entreprise = ?");
        values.push(nom_entreprise);
      }
      if (secteur_activite !== undefined) {
        updates.push("secteur_activite = ?");
        values.push(secteur_activite);
      }
      if (taille_entreprise !== undefined) {
        updates.push("taille_entreprise = ?");
        values.push(taille_entreprise);
      }
      if (adresse !== undefined) {
        updates.push("adresse = ?");
        values.push(adresse);
      }
      if (site_web !== undefined) {
        updates.push("site_web = ?");
        values.push(site_web);
      }
      if (strategie_entreprise !== undefined) {
        updates.push("strategie_entreprise = ?");
        values.push(strategie_entreprise);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        values.push(notes);
      }

      updates.push("date_mise_a_jour = CURRENT_TIMESTAMP");
      if (updates.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sql = `UPDATE ${KEY}_entreprises_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE entreprise_id = ?`;
      values.push(id);

      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (path === "/api/taches" && request.method === "POST") {
      const { libelle, status, date_objectif, notes, prospect_id } = await request.json();

      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
      await sqlite.execute(
        `INSERT INTO ${KEY}_taches_${SCHEMA_VERSION} (libelle, status, date_objectif, notes, prospect_id) VALUES (?, ?, ?, ?, ?)`,
        [libelle, status, date_objectif, notes, prospect_id],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/taches/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10);
      const { libelle, status, date_objectif, notes, prospect_id } = await request.json();

      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      const updates = [];
      const values = [];

      if (libelle !== undefined) {
        updates.push("libelle = ?");
        values.push(libelle);
      }
      if (status !== undefined) {
        updates.push("status = ?");
        values.push(status);
      }
      if (date_objectif !== undefined) {
        updates.push("date_objectif = ?");
        values.push(date_objectif);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        values.push(notes);
      }
      if (prospect_id !== undefined) {
        updates.push("prospect_id = ?");
        values.push(prospect_id);
      }

      updates.push("date_mise_a_jour = CURRENT_TIMESTAMP");
      if (updates.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const sql = `UPDATE ${KEY}_taches_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE tache_id = ?`;
      values.push(id);

      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (path === "/api/email_history" && request.method === "POST") {
      const { prospect_id, date_email, expediteur, destinataire, sujet, corps } = await request.json();
      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
      await sqlite.execute(
        `INSERT INTO ${KEY}_historique_emails_${SCHEMA_VERSION} (prospect_id, date_email, expediteur, destinataire, sujet, corps) VALUES (?, ?, ?, ?, ?, ?)`,
        [prospect_id, date_email, expediteur, destinataire, sujet, corps],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/email_history/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10);
      const { prospect_id, date_email, expediteur, destinataire, sujet, corps } = await request.json();

      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      const updates = [];
      const values = [];

      if (prospect_id !== undefined) {
        updates.push("prospect_id = ?");
        values.push(prospect_id);
      }
      if (date_email !== undefined) {
        updates.push("date_email = ?");
        values.push(date_email);
      }
      if (expediteur !== undefined) {
        updates.push("expediteur = ?");
        values.push(expediteur);
      }
      if (destinataire !== undefined) {
        updates.push("destinataire = ?");
        values.push(destinataire);
      }
      if (sujet !== undefined) {
        updates.push("sujet = ?");
        values.push(sujet);
      }
      if (corps !== undefined) {
        updates.push("corps = ?");
        values.push(corps);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sql = `UPDATE ${KEY}_historique_emails_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE email_id = ?`;
      values.push(id);
      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (path === "/api/call_history" && request.method === "POST") {
      const { prospect_id, date_appel, notes } = await request.json();
      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
      await sqlite.execute(
        `INSERT INTO ${KEY}_historique_appels_${SCHEMA_VERSION} (prospect_id, date_appel, notes) VALUES (?, ?, ?)`,
        [prospect_id, date_appel, notes],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/call_history/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10);
      const { prospect_id, date_appel, notes } = await request.json();

      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      const updates = [];
      const values = [];

      if (prospect_id !== undefined) {
        updates.push("prospect_id = ?");
        values.push(prospect_id);
      }
      if (date_appel !== undefined) {
        updates.push("date_appel = ?");
        values.push(date_appel);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        values.push(notes);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sql = `UPDATE ${KEY}_historique_appels_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE appel_id = ?`;
      values.push(id);

      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (path === "/api/meetings" && request.method === "POST") {
      const { prospect_id, date_meeting, participants, notes } = await request.json();
      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
      await sqlite.execute(
        `INSERT INTO ${KEY}_historique_meetings_${SCHEMA_VERSION} (prospect_id, date_meeting, participants, notes) VALUES (?, ?, ?, ?)`,
        [prospect_id, date_meeting, participants, notes],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/meetings/") && request.method === "PUT") {
      const id = parseInt(path.split("/").pop(), 10);
      const { prospect_id, date_meeting, participants, notes } = await request.json();
      // Check if prospect_id exists
      if (prospect_id) {
        const prospectCheck = await sqlite.execute(
          `SELECT 1 FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`,
          [prospect_id],
        );
        if (prospectCheck.rows.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Prospect ID '${prospect_id}' does not exist. Please select a valid Prospect.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
      const updates = [];
      const values = [];

      if (prospect_id !== undefined) {
        updates.push("prospect_id = ?");
        values.push(prospect_id);
      }
      if (date_meeting !== undefined) {
        updates.push("date_meeting = ?");
        values.push(date_meeting);
      }
      if (participants !== undefined) {
        updates.push("participants = ?");
        values.push(participants);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        values.push(notes);
      }
      if (updates.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sql = `UPDATE ${KEY}_historique_meetings_${SCHEMA_VERSION} SET ${updates.join(", ")} WHERE meeting_id = ?`;
      values.push(id);

      await sqlite.execute(sql, values);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (path.startsWith("/api/prospects/") && request.method === "DELETE") {
      const id = path.split("/").pop();

      // Use a transaction for cascading delete (even though we have ON DELETE CASCADE, it's good practice)
      const queries = [
        { sql: `DELETE FROM ${KEY}_prospects_${SCHEMA_VERSION} WHERE prospect_id = ?`, params: [id] },
      ];

      const result = await executeTransaction(queries);
      if (result.success) {
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      } else {
        return new Response(JSON.stringify({ success: false, message: "Error deleting prospect" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path.startsWith("/api/entreprises/") && request.method === "DELETE") {
      const id = path.split("/").pop();

      // Use a transaction, good practice for multi-step operations.
      const queries = [
        { sql: `DELETE FROM ${KEY}_entreprises_${SCHEMA_VERSION} WHERE entreprise_id = ?`, params: [id] },
      ];

      const result = await executeTransaction(queries);
      if (result.success) {
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      } else {
        return new Response(JSON.stringify({ success: false, message: "Error deleting entreprise" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    if (path.startsWith("/api/taches/") && request.method === "DELETE") {
      const id = path.split("/").pop();
      await sqlite.execute(
        `DELETE FROM ${KEY}_taches_${SCHEMA_VERSION} WHERE tache_id = ?`,
        [id],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/email_history/") && request.method === "DELETE") {
      const id = path.split("/").pop();
      await sqlite.execute(
        `DELETE FROM ${KEY}_historique_emails_${SCHEMA_VERSION} WHERE email_id = ?`,
        [id],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/call_history/") && request.method === "DELETE") {
      const id = path.split("/").pop();
      await sqlite.execute(
        `DELETE FROM ${KEY}_historique_appels_${SCHEMA_VERSION} WHERE appel_id = ?`,
        [id],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/meetings/") && request.method === "DELETE") {
      const id = path.split("/").pop();
      await sqlite.execute(
        `DELETE FROM ${KEY}_historique_meetings_${SCHEMA_VERSION} WHERE meeting_id = ?`,
        [id],
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    // More specific error handling for foreign key violations
    if (error.message.includes("SQLITE_CONSTRAINT") && error.message.includes("FOREIGN KEY")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid Foreign Key value. Please ensure that the selected Prospect or Entreprise exists.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } else if (error.message.includes("SQLITE_CONSTRAINT") && error.message.includes("UNIQUE")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database Constraint Violation: " + error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gestion de Prospects et Entreprises</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `,
    {
      headers: {
        "content-type": "text/html",
      },
    },
  );
}
