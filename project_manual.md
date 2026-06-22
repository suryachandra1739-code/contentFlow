---
title: "ContentFlow: Client Portal System Manual"
author: "Development Team"
date: "May 2026"
---

# 1. Abstract

ContentFlow is a comprehensive content approval and management platform designed to streamline the workflow between agencies and their clients. This document serves as a technical manual and feature guide for the Client Portal. It outlines the system architecture, authentication mechanisms, real-time data synchronization, and provides a detailed breakdown of the available modules and their underlying functionalities.

# 2. Introduction

## 2.1 Purpose
The purpose of the ContentFlow Client Portal is to provide a secure, transparent, and efficient interface for clients to review, approve, and track social media content proposed by their agency. It eliminates the need for email-based approvals and consolidates communication into a single, trackable platform.

## 2.2 Scope
This manual covers the features accessible via the Client Portal (`/client-portal` routes), including the interactive dashboard, the real-time review interface, historical data logs, and the activity auditing system. It also touches upon the underlying technical implementations that power these features.

## 2.3 Technologies Used
*   **Frontend Framework:** Next.js (App Router) for server-side rendering and optimized client-side routing.
*   **Backend & Database:** Supabase (PostgreSQL) for relational data storage and RESTful APIs.
*   **Authentication:** Supabase Auth for secure user session management.
*   **Real-time Communication:** Supabase Channels for WebSocket-based real-time updates.
*   **Styling:** Vanilla CSS with custom CSS variables implementing a volumetric glassmorphic design system.

# 3. System Architecture & Technical Overview

## 3.1 Authentication and Role-Based Access Control (RBAC)
The system employs a strict Role-Based Access Control mechanism. Upon logging in, the user's session is validated securely via Supabase Auth. The system queries the `users` table to determine the user's role (`admin`, `team`, or `client`) and their associated `client_id`. The Client Portal is isolated and ensures that clients can only access posts and data strictly associated with their specific `client_id`.

## 3.2 Real-time Data Synchronization
To ensure clients see the most up-to-date information without manually refreshing the page, the platform utilizes WebSocket connections. Components like the `AutoRefresh` module listen to specific Supabase Database channels (e.g., changes to the `posts` or `comments` tables). When a team member updates a post status or adds a comment, the payload is broadcasted, and the client's interface automatically refetches and re-renders the updated data.

## 3.3 Glassmorphic UI & Performance
The user interface is built using a custom "volumetric glassmorphism" design system. This relies on CSS properties like `backdrop-filter: blur()`, `rgba` background layers, and hardware-accelerated transitions to create a premium, translucent aesthetic while maintaining strict performance optimizations to avoid rendering bottlenecks on lower-end devices.

# 4. Module Description (Feature Guide)

## 4.1 Overview Dashboard
**Path:** `/client-portal`
The Overview module serves as the primary entry point. 
*   **Technical Implementation:** It performs server-side data fetching to retrieve the client's profile, calculate aggregate statistics (total, pending, approved, revision counts), and fetch the queue of posts with a `status` of `pending`.
*   **User Experience:** Displays a personalized greeting and a visually distinct grid of metrics. The "Pending Review" queue highlights items requiring immediate action, providing media thumbnails, platform metadata, and a direct link to the Review interface.

## 4.2 Post Review & Approval Workflow
**Path:** `/client-portal/review/[id]`
This is the core module where the approval workflow occurs.
*   **Interactive Platform Preview:** The system dynamically formats the provided media (`media_url`) and text (`caption`) to simulate exactly how it will render on the target social platform (e.g., LinkedIn, Instagram).
*   **AI-Assisted Optimization Insights:** The system parses post metadata to provide calculated projections for "Expected Reach" and an "Engagement Index", helping clients make data-driven approval decisions.
*   **Decision Center (State Machine):** Clients can trigger state transitions on the `posts` table:
    *   **Approve:** Transitions the post `status` to `approved`.
    *   **Request Changes:** Transitions the post `status` to `revision`. This action strictly requires the client to input a text payload (feedback), which is subsequently written to the `comments` table.
*   **Real-time Feedback Feed:** A chronological feed querying the `comments` table. It utilizes the WebSocket connection to display new comments from admins or team members instantly.

## 4.3 History Archive
**Path:** `/client-portal/history`
This module provides a comprehensive tabular view of all historical data.
*   **Functionality:** It queries the entire `posts` table associated with the `client_id`.
*   **Technical Features:** Implements URL-based state management (`?filter=...&sort=...`) for filtering (by status) and sorting (chronological/reverse-chronological). This allows users to bookmark specific filtered views.

## 4.4 Activity Log & Auditing
**Path:** `/client-portal/activity`
A robust audit trail module designed for transparency and accountability.
*   **Functionality:** Queries the `audit_log` table to present a chronological list of all system events related to the client's account.
*   **Tracked Events:** Includes payloads for `post_created`, `post_approved`, `post_revision`, `post_rejected`, and `comment_added`. Each entry records the timestamp, the user ID of the actor, and contextual metadata.

## 4.5 Notification System
**Component:** `NotificationBell.js`
A global module present in the application header.
*   **Functionality:** Polls the `/api/notifications` endpoint to retrieve unread alerts. It acts as a centralized bell icon, visually indicating the presence of new actions requiring the client's attention, such as newly assigned posts or unread team comments.

# 5. Conclusion
The ContentFlow Client Portal is engineered to be both visually stunning and technically robust. By leveraging modern web technologies like Next.js and Supabase, it provides a secure, real-time, and highly efficient workflow that bridges the gap between creative teams and client stakeholders.
