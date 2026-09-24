# Database Architecture

## Backend

Supabase + PostgreSQL.

## Core Entities

### Users

User account information.

### Subjects

Examples:

- physics
- chemistry
- biology

### Simulations

Metadata for each simulation.

### Experiments

Student-created experiments.

### Experiment Results

Measured outcomes.

### Progress

Track:

- completed simulations
- experiments
- learning objectives
- assessment results

### Assets

Metadata for 3D assets.

## Suggested Relationships

```text
Subject
  |
  +-- Simulations
        |
        +-- Experiments
        |
        +-- Learning Objectives
        |
        +-- Assets
```

## Persistence Rules

Do not persist every animation frame.

Persist meaningful events such as:

- experiment created
- experiment completed
- result recorded
- simulation completed
- assessment completed

## Security

Use Supabase Row Level Security.

Students should only access their own private experiment/progress records.

Public simulation metadata may be readable without authentication where appropriate.
