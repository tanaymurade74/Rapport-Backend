# Rapport  CRM – Backend

A REST API for a Customer Relationship Management app. It powers lead tracking, sales agents, comments, tags, and pipeline reporting, built with Express, Node.js, and MongoDB.

## Live API

[https://crm-backend-wlhu.vercel.app](https://crm-backend-wlhu.vercel.app)

> Base URL for all endpoints below. When running locally, use `http://localhost:3000`.

## Quick Start

```bash
git clone https://github.com/tanaymurade74/CRMBackend.git
cd CRMBackend
npm install
```

Create a `.env` file in the project root:

```env
MONGODB=your_mongodb_connection_string
```

Then start the server:

```bash
node index.js     # runs on http://localhost:3000
```

> No `start` script is defined yet. To use `npm start`, add `"start": "node index.js"` to the `scripts` in `package.json` (and `nodemon` for auto-reload during development).

## Technologies

* Node.js
* Express 5
* MongoDB
* Mongoose 9
* dotenv
* CORS

## Features

**Leads**

* Create, read, update, and delete leads
* Filter leads by sales agent, status, source, or tags
* Fuzzy search leads by name
* `closedAt` is set automatically when a lead's status changes to `Closed`

**Sales Agents**

* Create, list, fetch by ID, and delete agents
* Unique-email enforcement (duplicate emails return `409`)

**Comments**

* Add comments to a lead, authored by a sales agent
* List and delete comments

**Tags**

* Create and list reusable, uniquely-named tags

**Reports**

* Count leads still in the pipeline (not yet closed)
* List leads closed in the last 7 days

## API Reference

All responses are JSON. Base URL: the live API above, or `http://localhost:3000`.

### Leads

**`GET /leads`**
List leads. Optional query params: `salesAgent`, `status`, `source`, `tags`, `_id`.
Sample response: `{ "Leads": [ { _id, name, source, status, ... } ] }`

**`GET /leads/search/:searchTerm`**
Search leads by name (partial match).
Sample response: `{ "Leads": [ { _id, name, ... } ] }`

**`POST /leads`**
Create a lead. Required: `name`, `source`.
Sample response: `{ "Lead": { _id, name, status, ... } }`

**`PUT /leads/:id`**
Update a lead.
Sample response: `{ "Lead": { _id, name, status, ... } }`

**`DELETE /leads/:id`**
Delete a lead.
Sample response: `{ "message": "Lead deleted successfully" }`

### Sales Agents

**`GET /agents`**
List all sales agents.
Sample response: `{ "agents": [ { _id, name, email } ] }`

**`POST /agents`**
Create a sales agent. Required: `name`, `email`.
Sample response: `{ "agent": { _id, name, email } }`

**`GET /agents/:id`**
Get a sales agent by ID.
Sample response: `[ { _id, name, email } ]`

**`DELETE /agents/:id`**
Delete a sales agent.

### Comments

**`POST /leads/:id/comments`**
Add a comment to a lead. Required: `commentText`, `author`.
Sample response: `{ _id, lead, author, commentText, createdAt }`

**`GET /leads/:id/comments`**
List comments for a lead.
Sample response: `{ "comments": [ { _id, commentText, author, ... } ] }`

**`DELETE /comments/:commentId`**
Delete a comment by ID.

### Tags

**`POST /tag`**
Create a tag. Required: `name`.
Sample response: `{ "tag": { _id, name } }`

**`GET /tag`**
List all tags.
Sample response: `{ "tag": [ { _id, name } ] }`

### Reports

**`GET /report/pipeline`**
Count of leads not yet closed.
Sample response: `{ "totalPipelineLeads": 12 }`

**`GET /report/last-week`**
Leads closed in the last 7 days.
Sample response: `[ { id, name, salesAgent, closedAt } ]`

## Data Models

* **Lead** — `name`, `source` (Website/Referral/Cold Call/Advertisement/Email/Other), `salesAgent` (ref), `status` (New/Contacted/Qualified/Proposal Sent/Closed), `tags[]`, `timeToClose`, `priority` (High/Medium/Low), `closedAt`, timestamps
* **SalesAgent** — `name`, `email` (unique), `createdAt`
* **Comment** — `lead` (ref), `author` (ref), `commentText`, `createdAt`
* **Tag** — `name` (unique), `createdAt`

## Related Repositories

* **Frontend (React):** [https://github.com/tanaymurade74/CRM-Frontend](https://github.com/tanaymurade74/CRM-Frontend)

## Notes

* CORS is open to all origins; the API has no authentication.
* The server port is fixed at `3000` in `index.js`.

## Contact

Found a bug or have a feature request? Open an issue on the repo, or reach out at _your-email@example.com_ (replace with your contact).
