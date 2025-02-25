// api.js
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
  
  export default apiRequest;