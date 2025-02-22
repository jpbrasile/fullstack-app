if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { createClient } = require("@supabase/supabase-js");
  
  // Ensure you have set these environment variables in your deployment environment
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Create a Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  exports.handler = async (event, context) => {
    // Get HTTP method
    const method = event.httpMethod;
  
    // The URL path should follow the format:
    //   /api/prospects         → for GET (all) and POST operations
    //   /api/prospects/{id}    → for GET (single), PUT, or DELETE operations
    const pathSegments = event.path.split("/").filter(Boolean);
    // If the URL has 3 segments (e.g. ["api", "prospects", "{id}"]), capture the id, otherwise null.
    const id = pathSegments.length === 3 ? pathSegments[2] : null;
  
    try {
      if (method === "GET") {
        if (id) {
          // Fetch a single prospect by prospect_id
          const { data, error } = await supabase
            .from("prospects")
            .select("*")
            .eq("prospect_id", id)
            .single();
          if (error) throw error;
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        } else {
          // Fetch all prospects
          const { data, error } = await supabase.from("prospects").select("*");
          if (error) throw error;
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        }
      } else if (method === "POST") {
        // Create a new prospect – expect a JSON payload in the request body
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("prospects")
          .insert(payload)
          .single();
        if (error) throw error;
        return {
          statusCode: 201,
          body: JSON.stringify(data),
        };
      } else if (method === "PUT") {
        // Update an existing prospect – an ID in the URL is required
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing prospect ID in path" }),
          };
        }
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("prospects")
          .update(payload)
          .eq("prospect_id", id)
          .single();
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (method === "DELETE") {
        // Delete a prospect – an ID in the URL is required
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing prospect ID in path" }),
          };
        }
        const { data, error } = await supabase
          .from("prospects")
          .delete()
          .eq("prospect_id", id)
          .single();
        if (error) throw error;
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Prospect deleted", data }),
        };
      } else {
        // If the HTTP method is not supported, return 405 Method Not Allowed
        return {
          statusCode: 405,
          body: JSON.stringify({ message: `Method ${method} not allowed.` }),
        };
      }
    } catch (err) {
      console.error("Error in /api/prospects:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };