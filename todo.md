# Data Labeling Service - Project TODO

## Phase 1: Setup and Planning
- [x] Initialize web project with database and authentication
- [x] Research industry-standard labeling categories
- [x] Create database schema for datasets, labels, tasks, and taxonomy

## Phase 2: Backend - Data Cleaning
- [x] Implement text cleaning pipeline (duplicates, normalization, whitespace)
- [x] Implement image cleaning pipeline (format validation, metadata extraction)
- [x] Implement audio cleaning pipeline (noise reduction, format validation)
- [x] Create database query helpers for all tables

## Phase 3: Backend - AI Labeling Engine
- [x] Implement text labeling: sentiment analysis
- [x] Implement text labeling: named entity recognition (NER)
- [x] Implement text labeling: text classification
- [x] Implement text labeling: language identification
- [x] Implement image labeling: object detection
- [x] Implement image labeling: image classification
- [x] Implement audio labeling: speech-to-text transcription
- [x] Implement audio labeling: audio event classification
- [x] Implement audio labeling: speaker diarization
- [x] Create comprehensive labeling functions

## Phase 4: Backend - tRPC Procedures and Batch API
- [x] Create tRPC dataset procedures (create, list, upload items)
- [x] Create tRPC taxonomy procedures (create, get, list by type)
- [x] Create tRPC labeling task procedures (create, run, update)
- [x] Create tRPC batch API procedures (submit, status, results)
- [x] Implement batch job processing pipeline

## Phase 5: Frontend - Dashboard and UI
- [x] Create home page with technical blueprint design
- [x] Build dashboard layout with tabs
- [x] Build dataset list component
- [x] Create dataset dialog
- [x] Build upload items dialog
- [x] Build taxonomy management page with create/list UI
- [ ] Build labeling task creation and review interface
- [ ] Build export functionality (JSON, CSV)
- [ ] Build batch API documentation page

## Phase 6: Notifications and Testing
- [ ] Implement in-app notifications for task completion
- [ ] Add role-based access control for projects
- [ ] Create comprehensive vitest tests for backend
- [ ] Create vitest tests for frontend components

## Phase 7: Polish and Deployment
- [x] Apply technical blueprint design aesthetic to home and dashboard
- [ ] Test full end-to-end workflows
- [ ] Performance optimization
- [ ] API documentation and examples
- [ ] Create final checkpoint

## Data Model Overview
- Users: Authentication and role management
- Datasets: Store dataset metadata and file references
- DatasetItems: Individual items in a dataset (text, image, audio)
- LabelingTasks: Define labeling jobs and their configuration
- Labels: Store predicted and manual labels
- LabelTaxonomy: Define label categories and their properties
- BatchJobs: Track REST API batch submissions
- ApiKeys: API authentication for batch endpoints
