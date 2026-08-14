# AI Resume Screening Platform

This repository contains the codebase for the AI Resume Screening Platform, built as part of the internship program.

## Architecture
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (managed via Prisma ORM)
- **Authentication**: Auth.js (NextAuth) for Role-Based Access Control (RBAC)
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism)

## Getting Started

1. Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials and other secrets.
2. Run `npm install` to install dependencies.
3. Run `npx prisma migrate dev --name init` to initialize the database schema.
4. Run `npm run dev` to start the development server.

## Data Model
- Organizations, Users, and Roles
- Job Requisitions and Screening Rubrics
- Candidates, Applications, and Resume Documents
- Audit Events for tamper-evident logging

## Security & Responsible AI
- Secrets are not committed to source control.
- AI is strictly used as decision-support. All final decisions require human authority and are recorded in the Audit log.






