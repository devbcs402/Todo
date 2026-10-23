# AGENT.md --- TODO CRUD Project Instructions

## Project Goal

Implement a complete TODO management feature in the **existing
project**, with Create, Read, Update, and Delete (CRUD) operations
connected to the database.

### Required technology stack

-   **Frontend:** React
-   **Backend:** Node.js + Express
-   **Database:** MongoDB + Mongoose

Inspect the repository first and confirm its actual structure and
conventions. If the existing project differs from this stack, explain
the difference and ask before replacing its technology. Do not rebuild
or replace the existing project unnecessarily.

## Critical Database Safety Rules

1.  **Never delete, drop, rename, clear, or overwrite any existing
    MongoDB collection.**
2.  Create a **new, separate collection** dedicated to TODO records (for
    example, `todos`).
3.  Do not modify or repurpose existing collections, schemas, or models
    for TODO storage.
4.  Do not run destructive database commands, migrations, seed scripts,
    or cleanup scripts against existing data.
5.  Never use `dropDatabase()`, `dropCollection()`, `deleteMany({})`, or
    equivalent destructive operations.
6.  If the proposed collection/model name conflicts with an existing
    one, inspect the conflict and choose a safe new name. Never delete
    the existing collection.
7.  Preserve all existing data, user work, files, and unrelated
    features.
8.  Never put database credentials, API keys, or secrets in frontend
    code or commit them to source control.

## Required Workflow

### 1. Inspect Before Editing

-   Inspect the project folders, `package.json` files, React entry
    point, components, styles, API client, Express app, routes,
    controllers, models, database connection, authentication, and
    environment configuration.
-   Identify existing TODO-related code and extend it rather than
    creating duplicate functionality.
-   Follow the current project's naming, formatting, routing, and
    error-handling conventions.
-   Do not overwrite existing files without understanding and preserving
    their unrelated code.
-   If an essential file or configuration is missing, explain what is
    needed rather than inventing credentials or silently changing
    architecture.

### 2. React Frontend --- Required

**Build the TODO user interface using React. Do not use Angular, Vue,
plain HTML-only pages, or a different frontend framework.**

-   Use the React version and build tool already configured in the
    project (such as Vite or Create React App). Do not migrate tooling
    without a clear need.
-   Create reusable React components following the existing folder
    structure and conventions. For example:
    -   `TodoPage` or `TodoApp` --- page/container for TODO management.
    -   `TodoForm` --- create and edit TODOs.
    -   `TodoList` --- display TODO records.
    -   `TodoItem` --- show one TODO with actions.
-   Use the project's existing state-management and API-client approach
    where available. Otherwise, use React hooks such as `useState` and
    `useEffect`, plus a small API service module.
-   Connect every CRUD action to the backend API. **Do not treat React
    state or browser local storage as the database.**
-   On initial page load, fetch TODOs from the backend and show the
    results returned by MongoDB.
-   Provide a form to create a TODO with a required title and optional
    description.
-   Show each TODO's title, description, completion status, and useful
    timestamps when available.
-   Allow editing a TODO's title, description, and completion status.
-   Allow deleting an individual TODO only, after asking for
    confirmation.
-   Show loading, empty-list, success, and user-friendly error states.
-   Disable submit/action buttons while relevant requests are in
    progress to prevent accidental duplicate requests.
-   Validate required fields in the UI, while also enforcing validation
    on the backend.
-   Update or refetch the UI after a successful API response; show an
    error if the request fails.
-   Make the UI responsive and accessible, with labeled form fields,
    keyboard-friendly controls, and clear action labels.
-   Reuse the project's existing CSS framework and design system if
    present. Otherwise, add simple, maintainable CSS without unnecessary
    dependencies.
-   Keep the current application layout and unrelated screens working.

### 3. Create a Separate TODO Data Model

Create a new Mongoose model in the existing backend model directory,
following project conventions. Store TODO records in a dedicated new
collection.

Suggested fields: - `title` --- required string, trimmed, with a
reasonable maximum length. - `description` --- optional string. -
`completed` --- boolean, default `false`. - `createdAt` and `updatedAt`
--- timestamps.

Use schema validation and `timestamps: true`. Explicitly configure a new
collection name if needed to avoid accidentally reusing an existing
collection. Do not alter existing models.

If the app supports multiple users, associate each TODO with its owner
using the existing authentication/user ID pattern. Ensure users can only
access their own TODOs. Do not invent a new authentication system if one
already exists.

### 4. Implement Backend CRUD APIs

Follow the existing Express architecture. Add dedicated TODO
routes/controllers/services where appropriate.

Provide these operations (adapt the prefix to existing conventions):

-   `POST /api/todos` --- create a TODO.
-   `GET /api/todos` --- list TODOs from MongoDB.
-   `GET /api/todos/:id` --- retrieve one TODO.
-   `PUT` or `PATCH /api/todos/:id` --- update a TODO.
-   `DELETE /api/todos/:id` --- delete only the specified TODO record.

Requirements: - Persist every change in MongoDB; do not rely only on
frontend state or local storage. - Validate request bodies and MongoDB
ObjectId parameters. - Return appropriate HTTP status codes and
consistent JSON responses. - Handle missing records, invalid input,
database failures, and unexpected errors safely. - Allowlist editable
fields; never pass an unfiltered request body directly into a database
update. - Use existing authentication and authorization middleware when
present. - Do not expose stack traces, secrets, or database details in
production error responses. - Do not create destructive bulk-delete or
collection-management endpoints.

### 5. Connect React to the Backend

-   Use the existing API client (if present); otherwise create a small
    dedicated service module for TODO requests.
-   Keep the backend base URL in the appropriate environment variable
    for the current build tool. Never expose server secrets in frontend
    environment variables.
-   Configure the frontend to call the Express API and preserve existing
    CORS/security settings.
-   Handle network errors, non-success HTTP responses, and unexpected
    response shapes.
-   Ensure CRUD actions affect the database and still work after
    refreshing the browser.

### 6. Configuration and Security

-   Reuse the existing MongoDB connection and environment configuration.
-   Do not create a second database connection unless the architecture
    requires it.
-   Never hardcode MongoDB URIs, credentials, or secrets.
-   Do not expose server environment variables to the React bundle.
-   Preserve existing authentication, CORS, and security middleware.
-   Avoid adding dependencies if suitable packages already exist.

### 7. Testing and Verification

Run available lint, test, and build commands when practical. Verify
that:

1.  A TODO can be created from the React UI and saved in the new MongoDB
    collection.
2.  The React TODO list loads records from the backend after a page
    refresh.
3.  A single TODO can be fetched by ID.
4.  An existing TODO can be edited and the change persists after
    refresh.
5.  A single TODO can be deleted and no other TODO is affected.
6.  Invalid IDs and invalid input return safe errors.
7.  Loading, empty, and error states work in the React UI.
8.  Existing collections and unrelated application features remain
    untouched.
9.  If authentication exists, one user cannot read, update, or delete
    another user's TODOs.
10. The frontend build and backend checks pass, where configured.

Do not claim tests passed unless they were actually run. If MongoDB is
unavailable, report which database checks could not be completed.

## Change Management

-   Make small, focused changes.
-   Preserve existing architecture, code style, files, and user work.
-   Do not delete unrelated files or collections.
-   Before editing an existing file, understand its purpose and preserve
    unrelated code.
-   Add or update documentation for the TODO API and required
    environment variables without exposing secrets.
-   At completion, summarize:
    -   Files created and modified.
    -   React components and styling added.
    -   API endpoints added.
    -   The new Mongoose model and collection name.
    -   How to run the frontend and backend.
    -   How to test all CRUD operations.
    -   Tests/builds actually executed and their results.
    -   Any assumptions or remaining issues.

## Definition of Done

The TODO feature is complete when the **React frontend** can create,
read, update, and delete TODOs through the Express backend; all changes
persist in the new MongoDB collection; validation and errors are
handled; and **all existing database collections, records, files, and
unrelated features remain intact**.
