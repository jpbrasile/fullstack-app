# Full Stack App with Supabase and Netlify

This project is a full stack application that utilizes Supabase as the backend (via Edge Functions)
and Netlify for the frontend. The application is built using React and Tailwind CSS for a modern UI and
follows best coding practices with a clear code split.

## Project Structure

- `.env.example`: Example environment variables.
- `.gitignore`: Specifies intentionally untracked files.
- `README.md`: Project documentation.
- `backend/`: Contains the Supabase Edge Function code (`server.js`).
- `frontend/`: Contains the Netlify frontend application.
  - `index.html`: The entry point.
  - `src/App.jsx`: The main React component.
  - `src/index.jsx`: Client entry point for React.
  - `src/index.css`: Tailwind CSS base file.
  - `package.json`: Frontend package configuration.
  - `tailwind.config.js` and `postcss.config.js`: Tailwind CSS configurations.
- `netlify.toml`: Netlify build configuration.

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials.
2. In the `frontend` folder, install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. To run the frontend locally:
   ```bash
   npm start
   ```

4. To Deploy the Frontend on Netlify
After you’ve built your application, you can host your React/Tailwind frontend on Netlify using the following guidelines:

### Push Your Code to a Repository:
- Make sure your code—including the entire frontend folder—is committed and pushed to a Git repository (GitHub, GitLab, or Bitbucket). Netlify will pull your site directly from your repository.
- Create a New Site on Netlify:
- Log in to your Netlify account (or create one if you haven’t already), then click on "New site from Git." This option will let you connect your preferred Git provider.
- Connect Your Repository:
- Allow Netlify access to your repository account. Select the repository that contains your full‑stack project. If you’re keeping the frontend and backend code in separate folders within the same project, ensure you explicitly configure Netlify’s build settings to point to the frontend directory.
- Configure Build Settings:
   - In the Netlify setup screen, specify the following options:
      - Base directory (if applicable): If your repository contains both backend and frontend code, set the base directory to frontend.
      - Build command: Set this to npm run build (this is the command defined in your package.json and is used to launch Vite’s production build).
      - Publish directory: With Vite, this should usually be set to dist (the output folder created by npm run build).
      - Set Environment Variables (If Required):
      - If your frontend needs environment variables (for example, if you have a custom API URL or need to pass your Supabase credentials to the client), use the Netlify dashboard to add them. Click on “Site Settings,” navigate to “Build & deploy,” and then “Environment” to define any necessary values.
### Deploy and Monitor:
Once you have configured everything, click "Deploy site." Netlify will trigger a build, and you can follow the build logs in real time. When the build is complete, Netlify will provide you with a unique URL for your deployed site. Any push to your repository (within the configured branch) will trigger an automatic redeploy.
- Additional Options:
You may also configure custom domains, HTTPS, and redirects using Netlify’s settings.
Take advantages of Netlify's continuous deployment and preview environments to test changes before they hit production.

5. For the Backend: Deploy as a Supabase Edge Function
Your backend code—contained in backend/server.js—is designed to run as a Supabase Edge Function. Follow these guidelines to deploy it:

- Set Up a Supabase Project:
If you haven’t already, create a project on Supabase. Within your project’s dashboard, you’ll get the credentials required to interact with your database and configure your Edge Functions.
- Install the Supabase CLI:
The Supabase CLI makes it easier to manage and deploy functions. Follow these steps:
Install the CLI by running:
```bash
npm install -g supabase
```
- Authenticate by executing:
```bash
supabase login
```
and follow the on‑screen prompts.

- Initialize Functions in Your Project:
   - Within the root of your repository, run:
```bash
supabase init
```
This command sets up the necessary directories and configuration files for deploying Edge Functions.
- Organize Your Function Code:
Supabase expects each function to reside in its own folder under a designated functions directory. Copy (or move) your backend/server.js code into a new folder within the functions directory (for instance, functions/leads-manager). You might rename the file to index.js if required by your deployment settings. Make sure that any required dependencies (such as sqlite) are correctly imported via ESM.
- Deploy the Edge Function:
Once your code is organized, deploy your Edge Function with the CLI. From the root directory, run:
```bash
supabase functions deploy leads-manager
```
- Replace leads-manager with the actual name of your function folder. The CLI will bundle your code and deploy it to your Supabase project.
- Configure Environment Variables and Database:
- If your function requires environment variables (like connection strings or Supabase keys), make sure you add those via the Supabase dashboard. Also, ensure that your SQLite and database initialization code works in the Edge Function environment.
- Test Your Function:
Supabase provides a way to test your function locally before deploying. Run:
```bash
supabase functions serve
```
This command lets you invoke your Edge Functions on a local server so that you can verify all API endpoints work as expected.

### Use the Function in Your Frontend:
- Once deployed, you’ll receive a URL endpoint for your function. Update your frontend code’s API base paths (if necessary) to point to your deployed Edge Function. This way, when your frontend makes a call to /api/prospects (or any other endpoint), it will correctly route to the Supabase Edge Function.
- By following these detailed steps, you ensure that your frontend is seamlessly hosted on Netlify with continuous deployment and that your backend is deployed as a robust, edge‑deployed Supabase Edge Function.

## License

MIT License
