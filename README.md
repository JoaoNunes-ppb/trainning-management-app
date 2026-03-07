# Athlete Management App

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (included with Docker Desktop)

### Run with Docker (recommended)

Start the full stack (PostgreSQL + Spring Boot + React/Nginx):

```bash
docker compose up -d --build
```

The first build takes a few minutes (Maven dependencies + npm install). Subsequent builds use Docker layer caching.

Once all containers are running, open **http://localhost:3000** in your browser.

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000   |
| API      | http://localhost:3000/api/coaches |
| Backend  | http://localhost:8080   |

### Useful commands

```bash
# View running containers
docker compose ps

# Follow logs (all services)
docker compose logs -f

# Follow logs (single service)
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f frontend

# Stop containers (data is preserved in ./pgdata)
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Reset database completely
docker compose down
rm -rf ./pgdata
docker compose up -d
```

### Run locally (without Docker)

**Backend** (uses H2 in-memory database):

```bash
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend runs on http://localhost:8080. H2 console at http://localhost:8080/h2-console.

**Frontend** (Vite dev server with hot reload):

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and proxies API calls to the backend automatically.

---

## Product Overview

The goal of this project is to build a **simple web application to manage athletes and their workouts** for a small coaching studio.

The system will allow coaches to **plan training sessions, organize workouts, and track what each athlete should do on each day** through a calendar interface.

The core idea is to provide a **clear and easy way to plan workouts across multiple athletes**, without using spreadsheets or scattered notes.

The application is intended for **small teams (for example 1–3 coaches managing a group of athletes)** and therefore the system should remain **simple, fast, and easy to use**.

### Main Use Cases

Coaches should be able to:

- Create and manage **athletes**
- Create a library of **exercises**
- Build **workouts composed of exercises**
- Schedule workouts for athletes on specific days
- View all planned workouts in a **weekly calendar**

The **calendar view** is the main feature of the product. It should allow coaches to easily see the workouts planned for each athlete and navigate between weeks.

For example:

- Monday: Strength workout for Athlete A
- Tuesday: Running intervals for Athlete B
- Wednesday: Rest day
- Thursday: Cycling workout for Athlete C

Exercises will be reusable templates that can be added to workouts, but each exercise inside a workout may contain **custom notes or parameters specific to that athlete or that training session**.

The product focuses only on **workout planning**, not on tracking performance metrics or physiological data.

### Scope

Included in the first version:

- Athlete management
- Exercise library
- Workout creation
- Adding exercises to workouts
- Weekly calendar visualization

Out of scope for now:

- Authentication
- Payments
- Notifications
- Advanced analytics
- Athlete performance tracking

---

# Technology Overview

The system will be built as a **full-stack web application** with a clear separation between **backend and frontend**.

The goal is to use **modern, simple, and maintainable technologies** that are well suited for a small application.

## Backend

The backend will be responsible for:

- Managing the domain logic
- Storing data
- Exposing REST APIs used by the frontend

### Technologies

Frontend:
React with: Kotlin/JS wrapper

- **Kotlin** (primary language)
- **Spring Boot**
- **Spring Web (REST APIs)**
- **Spring Data JPA**
- **Relational Database**

### Database

The application will use a relational database such as:

- **PostgreSQL** (preferred) or Flyway, Database H2 (local)


or

- **SQLite** (acceptable for very small setups)

The database will store:

- coaches
- athletes
- exercises
- workouts
- workout exercises

### Backend Architecture

The backend will follow a typical **layered architecture**:

!<img src="Screenshot 2026-03-06 at 16.46.51.png">

