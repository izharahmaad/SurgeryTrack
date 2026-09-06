
<div align="center">

<img src="https://img.shields.io/badge/SurgeryTrack-v1.0.0-0F766E?style=for-the-badge&logo=shield&logoColor=white" alt="SurgeryTrack" />

# SurgeryTrack

### *Smart Surgery Management & Patient Communication System*

> A modern mobile healthcare platform for managing surgeries, tracking patient status, coordinating hospital staff, and keeping families informed — built with React Native, TypeScript, Expo, Firebase, and AI.

<img src="https://img.shields.io/github/stars/izharahmaad/SurgeryTrack?style=social" />
&nbsp;
<img src="https://img.shields.io/github/forks/izharahmaad/SurgeryTrack?style=social" />
&nbsp;
<img src="https://img.shields.io/github/watchers/izharahmaad/SurgeryTrack?style=social" />

</div>

***

## 📋 Table of Contents

- [SurgeryTrack](#surgerytrack)
    - [*Smart Surgery Management \& Patient Communication System*](#smart-surgery-management--patient-communication-system)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [✨ Features](#-features)
    - [🏥 Hospital Module](#-hospital-module)
    - [👨‍👩‍👧 Family Module](#-family-module)
    - [🔐 Authentication](#-authentication)
    - [🎨 UI \& Experience](#-ui--experience)
  - [🧩 Core Modules](#-core-modules)
  - [👥 User Roles](#-user-roles)
    - [🏥 Hospital / Staff](#-hospital--staff)
    - [👨‍👩‍👧 Family](#-family)
    - [🔐 Role-Based Architecture](#-role-based-architecture)
  - [🛠️ Tech Stack](#️-tech-stack)
    - [Frontend](#frontend)
    - [Backend \& Services](#backend--services)
    - [Architecture](#architecture)
  - [📁 Project Architecture](#-project-architecture)

***

## 🎯 Overview

**SurgeryTrack** is a mobile healthcare application designed to simplify surgery coordination and improve communication between hospitals, healthcare staff, patients, and their families.

The application provides a centralized workflow for creating and managing surgery records, monitoring surgery status, viewing important updates, and providing families with a simple way to stay informed.

SurgeryTrack is currently an **active work-in-progress project**. Core authentication, role selection, hospital workflows, surgery management, family features, reusable UI components, and Firebase services are already being developed and integrated.

The project is designed with a modular architecture so additional hospital workflows, AI capabilities, notifications, and patient-facing features can be added as development continues.

***

## ✨ Features

### 🏥 Hospital Module

- **Hospital Dashboard** — Overview of surgery activity and current operations.
- **Create Surgery** — Create and register new surgery records.
- **Surgery Details** — View detailed surgery information.
- **Status Management** — Update and track surgery progress.
- **Surgery Cards** — Reusable UI components for surgery information.
- **Statistics** — Dashboard statistics for surgery activity.

### 👨‍👩‍👧 Family Module

- **Surgery Scan** — Scan-based access to surgery information.
- **Family Updates** — Access relevant surgery status information.
- **AI Chatbot** — AI-assisted interaction for surgery-related information.

### 🔐 Authentication

- **Role Selection** — Select the appropriate user workflow.
- **Staff Role Selection** — Dedicated staff role selection flow.
- **Secure Login** — Firebase-based authentication architecture.
- **Protected Workflows** — Role-aware application navigation.

### 🎨 UI & Experience

- **Modern Healthcare UI**
- **Reusable Atomic Components**
- **Poppins Typography**
- **Animated Splash Screen**
- **Responsive Layouts**
- **Reusable Buttons & Inputs**
- **Dashboard Statistics**
- **Surgery Cards**
- **Shared Header Components**
- **Consistent Theme System**

***

## 🧩 Core Modules

| Module | Purpose |
|---|---|
| Authentication | User login and role-based access |
| Hospital Management | Surgery creation and management |
| Surgery Tracking | View and update surgery status |
| Family Access | Provide families with surgery information |
| AI Assistant | AI-powered surgery-related assistance |
| Firebase Services | Authentication and cloud data operations |
| UI Components | Reusable application interface components |
| Theme System | Centralized application styling |

***

## 👥 User Roles

SurgeryTrack is structured around role-based workflows.

### 🏥 Hospital / Staff

Hospital users can manage surgery-related information, access dashboards, create surgery records, and update surgery status.

### 👨‍👩‍👧 Family

Family users can access relevant surgery information and interact with the application's scanning and AI-assisted features.

### 🔐 Role-Based Architecture

The application separates workflows based on the authenticated user's role, allowing different users to access the functionality relevant to them.

***

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile application |
| TypeScript | Type-safe application development |
| Expo | React Native development and build ecosystem |
| Poppins | Application typography |
| Lottie | Animation support |

### Backend & Services

| Technology | Purpose |
|---|---|
| Firebase | Backend infrastructure |
| Firebase Authentication | User authentication |
| Cloud Firestore | Cloud data storage |
| AI Service | AI-powered assistant functionality |

### Architecture

| Technology / Pattern | Purpose |
|---|---|
| Atomic Design | Component organization |
| Custom Hooks | Reusable application logic |
| Service Layer | Firebase, AI, and surgery operations |
| TypeScript Types | Strong application typing |
| Centralized Theme | Consistent UI design |

***

## 📁 Project Architecture

SurgeryTrack follows a modular architecture with separation between UI components, screens, services, authentication, configuration, constants, and application types.

```text
SurgeryTrack/
├── app.json
├── App.tsx
├── index.ts
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
├── LICENSE
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
└── src/
    ├── assets/
    │   ├── fonts/
    │   │   └── poppins/
    │   ├── icons/
    │   ├── images/
    │   └── lottie/
    │
    ├── components/
    │   ├── AnimatedSplash.tsx
    │   ├── atoms/
    │   │   ├── STButton.tsx
    │   │   ├── STInput.tsx
    │   │   └── STText.tsx
    │   ├── molecules/
    │   │   ├── StatCard.tsx
    │   │   └── SurgeryCard.tsx
    │   └── organisms/
    │       └── Header.tsx
    │
    ├── config/
    ├── constants/
    │   ├── colors.ts
    │   └── index.ts
    │
    ├── hooks/
    │   └── useAuthStore.ts
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RoleSelectionScreen.tsx
    │   │   └── StaffRoleSelectionScreen.tsx
    │   │
    │   ├── family/
    │   │   ├── ChatBotScreen.tsx
    │   │   └── ScanScreen.tsx
    │   │
    │   ├── hospital/
    │   │   ├── CreateSurgeryScreen.tsx
    │   │   ├── DashboardScreen.tsx
    │   │   ├── SurgeryDetailScreen.tsx
    │   │   └── UpdateStatusScreen.tsx
    │   │
    │   ├── onboarding/
    │   │   ├── OnboardingScreen1.tsx
    │   │   ├── OnboardingScreen2.tsx
    │   │   └── OnboardingScreen3.tsx
    │   │
    │   └── shared/
    │       ├── NotificationsScreen.tsx
    │       └── ProfileScreen.tsx
    │
    ├── services/
    │   ├── ai.ts
    │   ├── firebase.ts
    │   └── surgery.ts
    │
    ├── theme.ts
    │
    ├── types/
    │   └── index.ts
    │
    └── utils/
        └── setupText.ts
````

---
