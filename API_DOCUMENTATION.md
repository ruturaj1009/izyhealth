# API Documentation v1

Base URL: `/api/v1`

## 👥 Users (Patients & Doctors)

### **List Users**
Retrieve a paginated list of users filtered by role.

-   **Endpoint**: `GET /users`
-   **Query Parameters**:
    -   `role` (Required): `PATIENT` | `DOCTOR` | `ADMIN`
    -   `page` (Optional): Page number (default: 1)
    -   `limit` (Optional): Items per page (default: 10)
-   **Response**:
    ```json
    {
      "status": 200,
      "data": [
        {
          "_id": "678...",
          "firstName": "John",
          "email": "john@example.com",
          "role": "PATIENT"
        }
      ],
      "metadata": {
        "pagination": {
          "total": 50,
          "page": 1,
          "limit": 10,
          "totalPages": 5
        }
      }
    }
    ```

### **Create User**
Register a new user (Patient or Doctor).

-   **Endpoint**: `POST /users`
-   **Body** (JSON):
    ```json
    {
      "firstName": "Jane",
      "lastName": "Doe",   // Optional
      "email": "jane@example.com", // Optional, must be unique if present
      "mobile": "1234567890", // Optional
      "role": "PATIENT",   // Required: PATIENT | DOCTOR
      "age": 30,           // Number
      "gender": "Female"
    }
    ```
-   **Response**: `201 Created`

---

## 🏢 Departments

### **List Departments**
Get all hospital departments.

-   **Endpoint**: `GET /departments`
-   **Response**:
    ```json
    {
      "status": 200,
      "data": [
        { "name": "Cardiology", "code": "CARD" }
      ]
    }
    ```

### **Create Department**
Add a new department.

-   **Endpoint**: `POST /departments`
-   **Body**:
    ```json
    {
      "name": "Neurology",
      "code": "NEURO"
    }
    ```

### **Get/Update/Delete Department**
Manage specific departments by ID.

-   **Endpoints**:
    -   `GET /departments/:id`
    -   `PUT /departments/:id`
    -   `DELETE /departments/:id`

---

## 🧪 Tests

### **List Tests**
Retrieve tests, optionally filtered by department.

-   **Endpoint**: `GET /tests`
-   **Query Parameters**:
    -   `department` (Optional): Filter by Department ID.
-   **Response**:
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "678...",
          "name": "Hemoglobin",
          "type": "normal",
          "price": 300,
          "shortCode": "HB",
          "department": { "_id": "...", "name": "Pathology" }
        }
      ]
    }
    ```

### **Create Test**
Create a new single test (Normal, Descriptive, or Group).

-   **Endpoint**: `POST /tests`
-   **Body**:
    ```json
    {
      "name": "Complete Blood Count",
      "type": "group", // normal | descriptive | group
      "department": "678...",
      "price": 500,
      "shortCode": "CBC",
      "revenueShare": 10,
      
      // If type === 'normal'
      "unit": "g/dL",
      "method": "Spectrophotometry",
      "referenceRanges": [{ "name": "Male", "min": 13, "max": 17 }],
      
      // If type === 'descriptive'
      "template": "<h1>Report...</h1>"
    }
    ```
-   **Response**: `201 Created`

### **Get Test Details**
Fetch a single test by ID.

-   **Endpoint**: `GET /tests/:id`
-   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "_id": "...",
        "name": "CBC",
        "subTests": [...] // Populated if type is group
      }
    }
    ```

### **Update Test**
Update a test (e.g., adding sub-tests to a group).

-   **Endpoint**: `PUT /tests/:id`
-   **Body**:
    ```json
    {
      "subTests": ["testId1", "testId2"]
    }
    ```
-   **Response**: `200 OK`
