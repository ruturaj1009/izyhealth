# Integration Guide: Legacy Frontend with Next.js Backend

## Project Structure
The following structure highlights where your legacy files reside and where the new API routes are located.

```
d:/x-pharma/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── users/
│   │           ├── route.ts        <-- GET (List), POST (Create)
│   │           └── [id]/
│   │               └── route.ts    <-- GET (Detail), PUT, DELETE
├── lib/
│   └── db.ts                   <-- MongoDB connection
├── models/
│   └── User.ts                 <-- Mongoose Schemas (User, Patient, Doctor)
├── public/                     <-- YOUR LEGACY FRONTEND FILES
│   ├── index.html              <-- Served at http://localhost:3000/
│   ├── style.css
│   ├── Patient/
│   ├── doctor/
│   ├── bill/
│   └── ...
├── .env.local                  <-- DB Connection String
└── package.json
```

## How to Integrate
Your legacy HTML files in `public/` are served by Next.js automatically.
Access them at: `http://localhost:3000/index.html` (or just `/`), `http://localhost:3000/Patient/somefile.html`, etc.

To interact with the backend, use `fetch` in your JavaScript tags.

### 1. Fetching Users (GET)
```javascript
async function fetchUsers(role) {
  // role is optional: 'PATIENT' or 'DOCTOR'
  const url = role ? `/api/v1/users?role=${role}` : '/api/v1/users';
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log('Users:', result.data);
      // Render your table here
    } else {
      console.error('Error:', result.error);
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}
```

### 2. Creating a Doctor (POST)
```javascript
async function createDoctor(data) {
  // Data must match the schema
  // Example:
  // {
  //   title: "Dr", firstName: "John", lastName: "Doe", 
  //   gender: "Male", age: 45, email: "dr.john@example.com", mobile: "1234567890",
  //   role: "DOCTOR", hospitalName: "City Hospital", revenueSharing: 20
  // }
  
  try {
    const response = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Doctor created successfully!');
    } else {
      alert('Error: ' + JSON.stringify(result.error));
    }
  } catch (err) {
    console.error(err);
  }
}
```

## Roles
Use the following string values for the `role` field:
- `PATIENT`
- `DOCTOR`
- `ADMIN`

## Discriminator Fields
- **Doctor**: Requires `hospitalName` and `revenueSharing` (0-100).
- **Patient**: Currently generic (standard fields only).

## Environment Setup
Ensure you have a `.env.local` file in the root with your MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/izyhealth
```
