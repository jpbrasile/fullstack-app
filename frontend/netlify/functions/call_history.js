if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { createClient } = require("@supabase/supabase-js");
  
  // Ensure these environment variables are set in your deployment environment
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Create a Supabase client instance
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  exports.handler = async (event, context) => {
    // Determine the HTTP method of the request
    const method = event.httpMethod;
  
    // Expect the URL path to follow the format:
    //   /api/historique_appels          → for GET (all) and POST operations
    //   /api/historique_appels/{id}     → for GET (single), PUT, or DELETE operations
    const pathSegments = event.path.split("/").filter(Boolean);
    const id = pathSegments.length === 3 ? pathSegments[2] : null;
  
    try {
      if (method === "GET") {
        if (id) {
          // Fetch a single call history record by its appel_id
          const { data, error } = await supabase
            .from("historique_appels")
            .select("*")
            .eq("appel_id", id)
            .single();
          
          if (error) throw error;
          
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        } else {
          // Fetch all call history records
          const { data, error } = await supabase
            .from("historique_appels")
            .select("*");
          
          if (error) throw error;
          
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        }
      } else if (method === "POST") {
        // Create a new call history record – expect a JSON payload in the request body
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("historique_appels")
          .insert(payload)
          .single();
        
        if (error) throw error;
        
        return {
          statusCode: 201,
          body: JSON.stringify(data),
        };
      } else if (method === "PUT") {
        // Update an existing call history record – require an ID in the URL
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing call ID in path" }),
          };
        }
        const payload = JSON.parse(event.body);
        const { data, error } = await supabase
          .from("historique_appels")
          .update(payload)
          .eq("appel_id", id)
          .single();
        
        if (error) throw error;
        
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (method === "DELETE") {
        // Delete a call history record – require an ID in the URL
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing call ID in path" }),
          };
        }
        const { data, error } = await supabase
          .from("historique_appels")
          .delete()
          .eq("appel_id", id)
          .single();
        
        if (error) throw error;
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Call history record deleted", data }),
        };
      } else {
        // Return 405 Method Not Allowed for unsupported HTTP methods
        return {
          statusCode: 405,
          body: JSON.stringify({ message: `Method ${method} not allowed.` }),
        };
      }
    } catch (err) {
      console.error("Error in /api/historique_appels:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };