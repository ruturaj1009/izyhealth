# X-Pharma Healthcare Management System

A modern, full-stack healthcare management application built with **Next.js 16**, **TypeScript**, and **MongoDB**. This system streamlines hospital operations by managing departments, doctors, and patients with a responsive and user-friendly interface.

## 🚀 Features

-   **Dashboard**: Centralized hub for hospital metrics (placeholder).
-   **Department Management**: Create and manage hospital departments.
-   **User Management**:
    -   **Patients**: Full CRUD operations with search, pagination, and optimized creating flow (Toast notifications, optional fields).
    -   **Doctors**: Dedicated portal for doctor management with advanced filtering and pagination.
-   **Test Management**:
    -   **Department-Centric Workflow**: Organize and browse tests by department.
    -   **Flexible Test Types**: Support for Normal (ranges), Descriptive (rich text), and Group tests.
    -   **Rich Text Editor**: Integrated Tiptap editor for creating comprehensive descriptive test templates with tables and formatting.
-   **Role-Based Access**: Specialized views and logic for `PATIENT`, `DOCTOR`, and `ADMIN` roles using Mongoose discriminators.
-   **Modern UI/UX**:
    -   Responsive Flexbox layouts.
    -   Sticky headers and independent scrollable lists.
    -   Polished, vibrant UI components with interactive states.
    -   Glassmorphism effects and smooth transitions.

## 🛠 Tech Stack

-   **Frontend**: Next.js 16 (App Router), React 19, CSS Modules (Flexbox/Grid).
-   **Editor**: Tiptap (Headless wrapper for ProseMirror) for rich text editing.
-   **Backend**: Next.js API Routes (Serverless).
-   **Database**: MongoDB with Mongoose (Schemas, Discriminators).
-   **Validation**: Zod for type-safe API validation.
-   **Notifications**: `react-hot-toast`.

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd x-pharma
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your MongoDB connection string:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/x-pharma
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📂 Project Structure

-   `app/`: Next.js App Router pages and API routes.
    -   `api/v1/`: REST API endpoints.
    -   `patients/`: Patient management pages.
    -   `doctors/`: Doctor management pages.
-   `models/`: Mongoose schemas (`User`, `Department`, `Patient`, `Doctor`).
-   `lib/`: Database connection helpers (`db.ts`).
-   `types/`: TypeScript interfaces and API response types.

## 🤝 Contributing

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.
