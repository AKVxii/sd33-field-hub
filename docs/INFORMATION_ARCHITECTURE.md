# Information Architecture

## Public primary navigation

1. Home  
2. Find My Ballot  
3. Candidates  
4. Events  
5. Volunteer  
6. District Facts  
7. More → District Map, Voting Records, Sources, Corrections, About, Español, Accessibility, Privacy, Legal, Feedback, Share  

## Header utility

- Secondary: Find My Ballot  
- Primary button: Volunteer  
- Development indicator via slim banner when private development is active  

## Operations (not primary nav)

Grouped under **Field / Captain Portal** (`/portal`):

| Route | Purpose |
|-------|---------|
| `/field` | Field tools hub |
| `/field/doors` | Door / walk list views |
| `/field/phones` | Phone lists |
| `/field/signs` | Sign sites |
| `/field/streets` | Thoroughfares |
| `/field/polls` | Polling places |
| `/field/import` | CSV import (ops) |
| `/pulsar` | Pulsar access request |
| `/schedule` | Shift board |
| `/team/*` | Captain views |
| `/roadmap` | Capacity roadmap |
| `/win-playbook` | Field guide |
| `/win-three` | Three-seat plan |
| `/carry` | Literature carry form |

Routes remain live; only navigation placement changed. Portal is **not** presented as ordinary public nav and does not claim password security unless the owner configures it.

## New / elevated public routes

| Route | Purpose |
|-------|---------|
| `/district-facts` | Geography, structure, methodology, voting-records placeholder |
| `/about` | Project transparency |
| `/sources` | Official SOS links |
| `/corrections` | How to report errors |
| `/portal` | Ops hub landing |

## Conversion hierarchy

1. Find My Ballot  
2. Volunteer  
3. Confirmed events  
4. Local project-focus candidates  
5. Full candidate directory  
6. Official SOS tools  
7. Share / feedback  

## Content moved off homepage

- Field phase plan, weekly targets, lit rules → `/win-three`, `/win-playbook`, `/how-to`  
- Ops CTAs (Pulsar, shift board) → `/portal`  
- Image galleries and long rights blocks reduced from hero path  
