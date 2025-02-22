if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { createClient } = require("@supabase/supabase-js");
  
  // Ensure the environment variables are set in your deployment environment
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Create a Supabase client instance
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  exports.handler = async (event, context) => {
    // Determine the HTTP method of the request
    const method = event.httpMethod;
  
    // Expect the URL to follow the format:
    //   /api/historique_emails          → for GET (all) and POST operations
    //   /api/historique_emails/{id}     → for GET (single), PUT, or DELETE operations
    const pathSegments = event.path.split("/").filter(Boolean);
    const id = pathSegments.length === 3 ? pathSegments[2] : null;
  
    try {
      if (method === "GET") {
        if (id) {
          // Fetch a single email history record by its email_id
          const { data, error } = await supabase
            .from("historique_emails")
            .select("*")
            .eq("email_id", id)
            .single();
          if (error) throw error;
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        } else {
          // Fetch all email history records
          const { data, error } = await supabase
            .from("historique_emails")
            .select("*");
          if (error) throw error;
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        }
      } else if (method === "POST") {
        // Create a new email history record – expect a JSON payload in the request body
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("historique_emails")
          .insert(payload)
          .single();
        if (error) throw error;
        return {
          statusCode: 201,
          body: JSON.stringify(data),
        };
      } else if (method === "PUT") {
        // Update an existing email history record – require an ID in the URL
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing email ID in path" }),
          };
        }
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("historique_emails")
          .update(payload)
          .eq("email_id", id)
          .single();
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (method === "DELETE") {
        // Delete an email history record – require an ID in the URL
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing email ID in path" }),
          };
        }
        const { data, error } = await supabase
          .from("historique_emails")
          .delete()
          .eq("email_id", id)
          .single();
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Email history record deleted", data }),
        };
      } else {
        // Return 405 Method Not Allowed for unsupported methods
        return {
          statusCode: 405,
          body: JSON.stringify({ message: `Method ${method} not allowed.` }),
        };
      }
    } catch (err) {
      console.error("Error in /api/historique_emails:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };