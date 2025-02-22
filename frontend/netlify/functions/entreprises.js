require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

// Ensure you have set these environment variables in Netlify
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event, context) => {
  // Determine the HTTP method of the request
  const method = event.httpMethod;

  // The URL path should follow the format:
  //   /api/entreprises         → for GET (all) and POST operations
  //   /api/entreprises/{id}    → for GET (single), PUT, or DELETE operations
  const pathSegments = event.path.split("/").filter(Boolean);
  // Expecting pathSegments to be either ["api", "entreprises"] or ["api", "entreprises", "{id}"]
  const id = pathSegments.length === 3 ? pathSegments[2] : null;

  try {
    if (method === "GET") {
      if (id) {
        // Fetch a single entreprise by its ID (assuming your primary key is "entreprise_id")
        const { data, error } = await supabase
          .from("entreprises")
          .select("*")
          .eq("entreprise_id", id)
          .single();
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else {
        // Fetch all entreprises
        const { data, error } = await supabase.from("entreprises").select("*");
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      }
    } else if (method === "POST") {
      // Create a new entreprise – expect JSON payload in the request body
      const payload = JSON.parse(event.body);
      const { data, error } = await supabase
        .from("entreprises")
        .insert(payload)
        .single();
      if (error) throw error;
      return {
        statusCode: 201,
        body: JSON.stringify(data),
      };
    } else if (method === "PUT") {
      // Update an existing entreprise – require an ID in the URL
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing entreprise ID in path" }),
        };
      }
      const payload = JSON.parse(event.body);
      const { data, error } = await supabase
        .from("entreprises")
        .update(payload)
        .eq("entreprise_id", id)
        .single();
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } else if (method === "DELETE") {
      // Delete an entreprise – require an ID in the URL
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing entreprise ID in path" }),
        };
      }
      const { data, error } = await supabase
        .from("entreprises")
        .delete()
        .eq("entreprise_id", id)
        .single();
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Entreprise deleted", data }),
      };
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: `Method ${method} not allowed.` }),
      };
    }
  } catch (err) {
    console.error("Error in /api/entreprises:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};