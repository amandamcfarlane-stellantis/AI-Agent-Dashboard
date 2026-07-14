# Stellantis IAM Developer Portal

Internal multi-page React + TypeScript UI for Stellantis Identity & Access Management workflows.

## Tech Stack

- Vite
- React 18
- TypeScript
- State-driven page navigation (no router)
- Inline style objects only

## Pages

### 1. Dashboard

High-level operational overview for IAM developers.

Contains:
- Hero banner with quick search
- Key stats:
  - Registered Apps
  - Active Tokens
  - Migrated Services
  - Dev Teams
- Quick-start cards that navigate to core workflows
- Right-side panel with recent updates and quick links

### 2. OIDC Quick Start Kit

Step-by-step onboarding flow for OpenID Connect integration.

Contains:
- 4-step accordion flow
- Progress bar with completed-step tracking
- Mark-done toggles
- Code snippets for:
  - PingFederate app registration JSON
  - Token request examples (Node.js / Java)
  - JWT validation example
- JWT claims decoder grid

### 3. Documentation Hub

Searchable, tab-filtered documentation workspace.

Contains:
- Search input
- Tabs: All, Migration, Configuration, Reference
- Expandable sections:
  - SiteMinder to PingFederate migration mapping
  - Orchestrator setup and policy workflow
  - OIDC endpoint reference
- Mapping table and YAML/code examples

### 4. Authentication Flow Visualization

Interactive breakdown of the authentication lifecycle.

Contains:
- Clickable flow stages:
  - User
  - Application
  - PingFederate
  - Token Exchange
  - API
- Request detail panel + code block per stage
- Sequence diagram view
- Token lifecycle cards:
  - Auth Code
  - Access Token
  - Refresh Token

### 5. Migration Guide

Transition guide from SiteMinder header-based auth to OIDC/JWT.

Contains:
- Deadline warning info box
- BEFORE vs AFTER comparison cards
- 10-row capability comparison
- Migration checklist with status indicators
- 5-phase migration timeline

## Shared Components

### CodeBlock

Reusable code snippet panel with:
- Dark theme
- Language badge
- Window-style dots
- Copy-to-clipboard button with success toggle

### InfoBox

Reusable message container with variants:
- tip
- warning
- danger
- info

## How To Launch

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Open in browser

Vite prints the local URL in terminal (typically):

- http://localhost:5173

## Build For Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
AI AGENT DASHBOARD/
  index.html
  package.json
  src/
    App.tsx
    main.tsx
    components/
      CodeBlock.tsx
      InfoBox.tsx
```
