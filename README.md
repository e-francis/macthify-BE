# Matchify Backend

A Node.js/TypeScript backend service for the Matchify dating application with profile management and authentication features.

## Features

- User profile creation with validation
  - Profile picture upload
  - Age verification (18+)
  - Maximum 5 interests
  - Gender validation
  - Email format validation
- Authentication system
  - Email and passcode login
  - Login attempt tracking (3 attempts max)
  - Account locking after exceeded attempts
- Security features
  - Password hashing
  - Rate limiting
  - Input validation
  - File size restrictions

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- 
## Project Setup

1. Clone the repository
```bash
git clone https://github.com/e-francis/matchify-BE.git
cd matchify-BE
```

2. Install dependencies
```bash
npm install
```

3. Create a Firebase project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable Firestore Database
- Enable Storage
- Generate new web app credentials

4. Set up environment variables
```bash
cp .env.example .env
```
Update the `.env` file with your Firebase credentials:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
PORT=8080
```

5. Build the project
```bash
npm run build
```

## Running the Application

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

## API Endpoints

### Create Profile
```http
POST /v1/api/create-profile
Content-Type: multipart/form-data

Request body:
{
  "firstName": "string",
  "lastName": "string",
  "dob": "YYYY-MM-DD",
  "location": "string",
  "interests": ["string"],
  "sex": "male|female|other",
  "email": "string",
  "passcode": "string",
  "profilePicture": File
}

Response:
{
  "success": true,
  "message": "Profile created successfully",
  "profileId": "string"
}
```

### Login
```http
POST /v1/api/auth/login
Content-Type: application/json

Request body:
{
  "email": "string",
  "passcode": "string"
}

Response:
{
  "success": true,
  "message": "Login successful"
}
```

## Validation Rules

### Profile Creation
- First Name: 2-50 characters
- Last Name: 2-50 characters
- DOB: Must be 18+ years old
- Location: 2-100 characters
- Interests: Array with maximum 5 items
- Sex: Must be 'male', 'female', or 'other'
- Email: Valid email format
- Passcode: 6 characters
- Profile Picture: Required, max 5MB

### Login
- Email: Valid email format
- Passcode: String, minimum 6 characters
- Maximum 3 login attempts before account lock


## Error Handling

The API returns structured error responses in the following format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Array of specific error messages"]
}
```
Logging was also added for debugging and to verify the requests endpoints receive

## Security Considerations

- All passwords are hashed using bcrypt
- Rate limiting is implemented for login and profile creation
- File uploads are restricted to images and size limited
- Input validation is performed on all endpoints
- Security headers are implemented using Helmet

## Development

### Project Structure
```
matchify-BE/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── interfaces/   # TypeScript interfaces
│   ├── middleware/   # Express middleware
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── app.ts        # Application entry point
```


## License

[MIT License](LICENSE)
