# Scratchpad: Login & Account Creation Feature Review

## Background and Motivation

The user wants to review the existing back-end and front-end implementation of the login and account creation features. The goal is to identify issues, potential improvements, and address reported front-end problems ("the front end does not work properly"). This review aims to ensure the features are secure, robust, user-friendly, and correctly implemented across the full stack.

## Key Challenges and Analysis

-   **Frontend Functionality:** The user explicitly mentioned the front-end is not working properly. Investigating the cause of these issues (e.g., state management, API calls, UI rendering, validation, routing) is a primary focus.
-   **Backend Logic:** Reviewing the backend for correct handling of user credentials, password hashing, session management/token generation, input validation, and error handling is necessary.
-   **Security:** Ensuring security best practices are followed on both front-end (e.g., input sanitization, secure handling of tokens) and back-end (e.g., protection against common vulnerabilities like SQL injection, XSS, CSRF, secure password storage, rate limiting) is paramount.
-   **API Integration:** Verifying that the front-end correctly communicates with the back-end API endpoints for login and registration. Checking request/response formats, status codes, and error handling consistency.
-   **User Experience (UX):** Assessing the flow, clarity of instructions, feedback mechanisms (e.g., loading states, error messages), and overall ease of use for both login and account creation.
-   **Code Quality:** Checking for code clarity, maintainability, adherence to conventions, potential performance bottlenecks, and proper separation of concerns.

## High-level Task Breakdown

1.  **Task 1: Locate Relevant Files**
    *   Identify the key front-end components/pages/routes and back-end controllers/services/models/routes related to login and account creation.
    *   **Success Criteria:** A list of relevant file paths for both front-end and back-end is documented in this scratchpad.
    *   **Identified Files:**
        *   **Backend:**
            *   `back end/routes/userRoutes.js` (API Routes)
            *   `back end/controllers/userController.js` (Request Handlers)
            *   `back end/models/user.js` (Database Logic)
            *   `back end/middleware/auth.js` (Authentication Middleware)
            *   `back end/config/passportConfig.js` (Passport Strategy)
            *   `back end/config/dbConnection.js` (DB Connection)
        *   **Frontend:**
            *   `front end/src/pages/auth/Login.jsx` (Login Page/Form)
            *   `front end/src/pages/auth/Register.jsx` (Registration Page/Form)
            *   `front end/src/contexts/AuthContext.jsx` (Auth State & API Calls)
            *   `front end/src/App.jsx` (Routing & Setup)
            *   `front end/src/components/common/PrivateRoute.jsx` (Route Guard)
            *   `front end/src/components/common/Navbar.jsx` (Navigation/Logout)
            *   `front end/src/main.jsx` (Axios Config)
2.  **Task 2: Analyze Backend Implementation (Account Creation)**
    *   Read and review the back-end code responsible for user registration (routes, controllers, services, models, validation logic).
    *   Check for: secure password hashing (algorithm, salt), input validation (type, length, format), unique constraint handling (e.g., email/username), proper error handling and status codes, database interactions, and transaction management (if applicable).
    *   **Success Criteria:** Documented findings (issues, potential improvements, good practices) regarding the back-end account creation logic are added to this scratchpad.
    *   **Findings:**
        *   **Good Practices:**
            *   Uses `express-validator` for input validation (`username`, `email`, `password`).
            *   Checks for existing email using `getUserByEmail` before creation (prevents duplicates).
            *   Uses `bcrypt.hash` (saltRounds = 10) for password hashing.
            *   Uses parameterized queries (`pool.query("..."), [params]`) in the model (`models/user.js`), preventing SQL injection.
            *   Handles validation errors (400), existing user errors (400), and server errors (500) with `try...catch`.
            *   Returns `201 Created` status code on success.
            *   Logs new user in automatically using `req.login` (Passport session).
        *   **Potential Issues/Improvements:**
            *   **Password Strength:** Minimum length (6) is low; consider increasing (e.g., 8+) and potentially adding special character requirement via regex in validation rules (`routes/userRoutes.js`).
            *   **JWT on Register:** Registration response (`controllers/userController.js`) sets a session via `req.login` but doesn't return a JWT like the `/login` endpoint does. This might be inconsistent if the frontend primarily uses JWT. Verify if `ensureAuthenticated` middleware relies solely on sessions or can use JWTs. Consider returning a JWT upon registration for consistency.
            *   **Error Status Code:** Using `409 Conflict` might be semantically better than `400 Bad Request` when an email already exists.
            *   **Error Messages:** Client-facing error messages like "Server error during registration" could be made more generic in production.
            *   **Salt Rounds:** Consider increasing bcrypt salt rounds from 10 to 12 for better security posture.
            *   **Username Validation:** The `username` field validation is basic. Consider adding checks for allowed characters if necessary.
3.  **Task 3: Analyze Backend Implementation (Login)**
    *   Read and review the back-end code responsible for user login (routes, controllers, authentication logic/middleware).
    *   Check for: credential verification (username/email existence), password comparison (using the same hashing algorithm and salt), session/token generation (type, security, expiration), security measures (e.g., rate limiting, account lockout potential), and appropriate error handling/status codes.
    *   **Success Criteria:** Documented findings (issues, potential improvements, good practices) regarding the back-end login logic are added to this scratchpad.
    *   **Findings:**
        *   **Good Practices:**
            *   Uses Passport.js `local` strategy (`config/passportConfig.js`) for email/password authentication.
            *   Looks up user by email using parameterized query (prevents SQL injection).
            *   Securely compares passwords using `bcrypt.compare` against the stored hash.
            *   Handles errors correctly (user not found, incorrect password via `done(null, false, { message: '...' })`; server errors via `try...catch` and `done(err)`).
            *   Establishes a session using `req.logIn` upon successful authentication (`controllers/userController.js`).
            *   Generates a JWT using `jsonwebtoken` with configurable secret (`JWT_SECRET`) and expiry (`JWT_EXPIRES_IN` or '1h'). Payload includes `user_id`, `username`.
            *   Returns appropriate status codes (200 on success, 401 on failure, 500 on error).
            *   `ensureAuthenticated` middleware (`middleware/auth.js`) protects routes by checking `req.isAuthenticated()`.
        *   **Potential Issues/Improvements:**
            *   **Dual Authentication (Session + JWT):** Login creates both a session cookie (`req.logIn`) AND returns a JWT. However, `ensureAuthenticated` only checks for the session (`req.isAuthenticated()`), ignoring the JWT. This is inconsistent. **Recommendation:** Decide whether to use session-based or JWT-based authentication for API calls and stick to one: (1) If sessions, remove JWT generation. (2) If JWT, update `ensureAuthenticated` (or add new middleware) to validate the JWT from the `Authorization` header (e.g., using `passport-jwt`).
            *   **Rate Limiting:** The `/login` endpoint lacks rate limiting, making it vulnerable to brute-force attacks. Implement rate limiting (e.g., using `express-rate-limit`).
            *   **Input Validation:** Consider adding `express-validator` rules to the `/login` route to check for non-empty email/password before hitting the Passport strategy for clearer upfront validation.
            *   **JWT Not Used:** As mentioned, the returned JWT is not currently used by the backend for route protection.
4.  **Task 4: Analyze Frontend Implementation (Account Creation)**
    *   Read and review the front-end code for the registration form/page/component.
    *   Check for: UI structure, state management, form handling, client-side validation (completeness, feedback), API call logic (correct endpoint, method, payload), handling of API responses (success/error states, user feedback), and potential exposure of sensitive information.
    *   **Success Criteria:** Documented findings (issues, potential improvements, specific problems potentially causing malfunction) regarding the front-end account creation implementation are added to this scratchpad.
    *   **Relevant Files:** `front end/src/pages/auth/Register.jsx`, `front end/src/contexts/AuthContext.jsx`
    *   **Findings:**
        *   **Good Practices:**
            *   Uses React Context (`AuthContext`) for auth state/logic.
            *   Uses `axios` for API calls (POST to `/register`).
            *   Basic UI feedback (loading state, generic error message).
            *   Navigates user (`navigate('/')`) on successful registration.
        *   **Issues & Potential Causes for Malfunction:**
            *   **Field Mismatch (High Severity):** `Register.jsx` uses a state variable `name` for the input field and passes `name` to the `register` function in `AuthContext`. However, `AuthContext.register` and the backend API expect a field named `username`. This mismatch means the payload sent to `/register` is likely incorrect (`{ name: ..., email: ..., password: ... }` instead of `{ username: ..., email: ..., password: ... }`), causing backend validation failure or data issues. **This needs correction.**
            *   **Generic Error Handling (Medium Severity):** Both `AuthContext.register` and `Register.jsx` use generic error messages ("Registration failed", "Failed to create an account"). Specific backend errors (e.g., validation details like "password too short", conflict like "Email already exists") are not parsed from the `error.response.data` and displayed to the user. This hinders debugging and provides poor UX.
            *   **Lack of Client-Side Validation:** Minimal client-side validation (only HTML5 `required`). Users don't get immediate feedback on invalid input (e.g., password rules) before submitting the form.
        *   **Improvements:**
            *   **Fix Field Mismatch:** Rename `name` state and input to `username` in `Register.jsx` to match `AuthContext` and backend.
            *   **Improve Error Handling:** Update `AuthContext.register` to catch `axios` errors, inspect `error.response.data.message` or `error.response.data.errors`, and throw/return more specific error information. Update `Register.jsx`'s `catch` block to display these specific errors.
            *   **Add Client-Side Validation:** Implement validation in `Register.jsx` (e.g., in `handleSubmit` or using a form library) to check username length, email format, and password rules before enabling submission or calling the API.
            *   **Consider Password Confirmation:** Add a "Confirm Password" field and validation logic.
5.  **Task 5: Analyze Frontend Implementation (Login)**
    *   Read and review the front-end code for the login form/page/component.
    *   Check for: UI structure, state management, form handling, client-side validation, API call logic (correct endpoint, method, payload), handling of API responses (success/error states, user feedback), secure token/session storage and usage, and redirection logic after successful login.
    *   **Success Criteria:** Documented findings (issues, potential improvements, specific problems potentially causing malfunction) regarding the front-end login implementation are added to this scratchpad.
    *   **Relevant Files:** `front end/src/pages/auth/Login.jsx`, `front end/src/contexts/AuthContext.jsx`
    *   **Findings:**
        *   **Good Practices:**
            *   Uses `AuthContext` for auth state/logic.
            *   Calls correct API endpoint (`POST /login`) with `email` and `password`.
            *   Updates global `user` state in `AuthContext` on success.
            *   Navigates user (`navigate('/')`) on success.
            *   Basic UI feedback (loading state, generic error).
            *   `axios` configured with `withCredentials = true`, allowing session cookie usage.
        *   **Issues & Potential Causes for Malfunction:**
            *   **Generic Error Handling (Medium Severity):** Similar to registration, specific backend login errors (e.g., "incorrect password") are not parsed from `error.response.data.message` and displayed. Shows only "Failed to sign in".
            *   **Ignored JWT Token (High Severity if JWT intended):** `AuthContext.login` receives a JWT from the backend but does not store or use it. Authentication appears to rely solely on the session cookie set by the backend and sent by the browser (`withCredentials=true`). This conflicts with the backend generating a JWT and the backend's `ensureAuthenticated` middleware *only* checking sessions. This reinforces the **Dual Authentication** issue from Task 3.
            *   **Lack of Client-Side Validation:** No client-side check for email format.
        *   **Improvements:**
            *   **Improve Error Handling:** Update `AuthContext.login` to parse `error.response.data.message` and provide specific feedback. Update `Login.jsx` to display it.
            *   **Clarify Auth Strategy (Session vs. JWT):** Decide on one method. **If Session:** Remove JWT generation/return from backend `/login`. **If JWT:** Store token in frontend (`AuthContext.login`), send it in `Authorization` header (axios interceptor), update backend middleware (`ensureAuthenticated`) to validate JWT, update frontend `checkAuth` logic.
            *   **Add Client-Side Validation:** Add basic email format check in `Login.jsx`.
6.  **Task 6: Summarize Findings and Recommend Next Steps**
    *   Consolidate all findings from the previous tasks.
    *   Prioritize identified issues based on severity (e.g., security flaws > major bugs > UX issues > minor improvements).
    *   Propose concrete, actionable next steps for addressing the issues and implementing improvements.
    *   **Success Criteria:** A comprehensive summary report is documented in this scratchpad, including prioritized issues and actionable recommendations for the Executor phase.
    *   **Summary & Prioritized Issues:**
        1.  **(High) Frontend Registration Field Mismatch:** `Register.jsx` uses `name`, but backend/context expects `username`. *Likely cause of registration failure.*
        2.  **(High) Inconsistent Auth Strategy:** Backend generates both Session and JWT on login, but only Session is checked by middleware (`ensureAuthenticated`). Frontend ignores the JWT on login. *Needs clarification and unification (Session OR JWT).*
        3.  **(Medium) Generic Frontend Error Handling:** Login and Register forms show generic failure messages, not specific backend errors (e.g., "Incorrect password", "Email already exists"). *Poor UX.*
        4.  **(Medium) Missing Backend Rate Limiting:** `/login` endpoint is vulnerable to brute-force attacks. *Security risk.*
        5.  **(Low) Missing Frontend Client-Side Validation:** No immediate feedback for invalid email format or password rules. *UX improvement.*
        6.  **(Low) Weak Backend Password Rules:** Minimum length 6, no special chars required. *Security hardening.*
        7.  **(Low) Other Minor Backend Issues:** Salt rounds (10 vs 12), 409 vs 400 status code, generic server errors, basic username validation.
    *   **Recommended Next Steps (Executor Plan):**
        1.  **Fix Frontend Registration Field Mismatch:** Edit `Register.jsx` to use `username` instead of `name`.
        2.  **Decide and Unify Authentication Strategy (Session vs. JWT):** Requires **USER DECISION**. Based on choice, either remove JWT generation from backend OR implement full JWT handling (middleware update, frontend token storage/sending).
        3.  **Implement Specific Frontend Error Handling:** Update `AuthContext` and `Login.jsx`/`Register.jsx` to parse and display specific backend error messages.
        4.  **Add Backend Login Rate Limiting:** Install and configure `express-rate-limit` for the `/login` route.
        5.  **Implement Frontend Client-Side Validation:** Add checks for email format, password rules, username length in `Login.jsx`/`Register.jsx`.
        6.  **(Optional/Lower Priority) Address Minor Backend Improvements:** Strengthen password rules, use 409 status, increase salt rounds, etc.

## Project Status Board

-   [x] Task 1: Locate Relevant Files
-   [x] Task 2: Analyze Backend Implementation (Account Creation)
-   [x] Task 3: Analyze Backend Implementation (Login)
-   [x] Task 4: Analyze Frontend Implementation (Account Creation)
-   [x] Task 5: Analyze Frontend Implementation (Login)
-   [x] Task 6: Summarize Findings and Recommend Next Steps
-   [x] ~~Analyze the two navbars issue on the meeting page.~~ (Fixed)
-   [x] ~~Remove the redundant global Navbar from the meeting detail route in `App.jsx`.~~ (Done)
-   [x] Verify the fix and ensure the meeting page header retains necessary functionality.
-   [x] Add Go Back button to meeting page header.
-   [x] Change profile picture from first letter to profile icon (Navbar)
-   [x] Change profile picture from first letter to profile icon (Space Members List)

## Executor's Feedback or Assistance Requests

*   ~~**Request:** Please manually verify the meeting page (`/spaces/:spaceId/meetings/:meetingId`) to confirm that only one navbar (the meeting-specific one) is present and that the language toggle, screen recording link, and meeting details are still visible and functional in the header.~~ (User confirmed this is fixed implicitly by requesting the next change).
*   Added a "Go Back" button (using `navigate(-1)`) with an arrow icon to the header of the `BilingualMeeting.jsx` component for navigation consistency.
*   **Request:** Please verify that the "Go Back" button is present on the meeting detail page and functions correctly, taking you to the previous page (likely the Space Detail page).
*   Completed the task to change the profile picture display.
*   Replaced the member's first initial with a standard `UserIcon` in the Space Members list (`frontend/src/pages/spaces/SpaceDetail.jsx`).

## Lessons

*(Executor will update this section based on findings during implementation)*

---

# Feature: Screen Recording

## Background and Motivation

The user wants to add a screen recording feature to the application. This involves:
1.  Adding a navigation element (e.g., a button, potentially in the Navbar or another relevant location) labeled "Screen Recording".
2.  Creating a dedicated page for this feature, accessible via the navigation element.
3.  Implementing the core screen recording functionality on this new page, including:
    *   A mechanism to select the screen or application window to be recorded.
    *   Controls to start and stop the recording.
    *   A way to download the completed recording.

## Key Challenges and Analysis (Initial Thoughts)

*   **Browser APIs:** Screen recording primarily relies on browser APIs like `getDisplayMedia` (for screen/window selection) and `MediaRecorder` (for recording the stream). Ensuring cross-browser compatibility and handling permissions gracefully is crucial.
*   **UI/UX:** Designing an intuitive interface for screen selection, recording controls (start, stop, pause/resume if needed), status indicators (recording time, state), and download options.
*   **Output Format/Encoding:** Deciding on the output video format (e.g., WebM, MP4) and potential encoding options. `MediaRecorder` often defaults to WebM. Converting to MP4 might require server-side processing or client-side libraries (which can be resource-intensive).
*   **Large File Handling:** Screen recordings can become very large. Efficient handling during recording (e.g., chunking) and download is necessary.
*   **State Management:** Managing the state of the recorder (idle, selecting, recording, stopped), the media stream, and the recorded data chunks.
*   **Integration:** How this feature integrates with existing concepts like Spaces or Meetings (if at all) needs consideration. For now, it seems like a standalone feature.

## High-level Task Breakdown

1.  **Task SR1: Setup Screen Recording Page & Navigation**
    *   Create a new React component file for the Screen Recording page (e.g., `front end/src/pages/recording/ScreenRecorder.jsx`).
    *   Add a basic structure (title, placeholder text) to the new component.
    *   Add a new route in `front end/src/App.jsx` for `/recording` that renders the `ScreenRecorder` component, wrapped in `PrivateRoute`.
    *   Add a "Screen Recording" link/button to the main navigation (e.g., in `front end/src/components/common/Navbar.jsx`) that navigates to `/recording`.
    *   **Success Criteria:** The Screen Recording page is accessible via the new navigation link, displays basic placeholder content, and is protected by authentication.
2.  **Task SR2: Implement Screen Selection**
    *   In `ScreenRecorder.jsx`, add a button "Select Screen/Window".
    *   Implement the logic for this button's `onClick` handler:
        *   Use `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })` to request screen sharing permission and get a `MediaStream`. Handle potential errors (user denial, API not supported).
        *   Store the obtained `MediaStream` in the component's state.
        *   Add a `<video>` element to preview the selected stream (muted).
    *   **Success Criteria:** Clicking the button prompts the user to select a screen/window. Upon selection, a preview of the selected screen appears in the video element. Errors during selection are handled gracefully.
3.  **Task SR3: Implement Start/Stop Recording Controls**
    *   Add "Start Recording" and "Stop Recording" buttons to `ScreenRecorder.jsx`. Initially, "Start" should be enabled only after a stream is selected, and "Stop" should be disabled.
    *   Implement the "Start Recording" logic:
        *   Create a `MediaRecorder` instance using the `MediaStream` from state.
        *   Initialize an array in state to hold recorded data chunks (`recordedChunks`).
        *   Attach `ondataavailable` event listener to the `MediaRecorder` to push data chunks into the `recordedChunks` array.
        *   Attach `onstop` event listener (to be used later for download).
        *   Call `mediaRecorder.start()`.
        *   Update component state (e.g., set `isRecording` to true) to disable "Start" / "Select Screen" and enable "Stop".
    *   Implement the "Stop Recording" logic:
        *   Call `mediaRecorder.stop()`.
        *   Stop the tracks of the `MediaStream` (`stream.getTracks().forEach(track => track.stop());`) to end the screen share indication.
        *   Update component state (e.g., set `isRecording` to false, clear stream/recorder references) to re-enable "Select Screen" and disable "Stop".
    *   **Success Criteria:** User can start recording the selected screen stream. State updates correctly disable/enable buttons. User can stop the recording, which also stops the screen share. Data chunks are collected (verification might require logging).
4.  **Task SR4: Implement Download Functionality**
    *   Add a "Download Recording" button, initially disabled.
    *   In the `MediaRecorder`'s `onstop` event handler (defined in Task SR3):
        *   Create a `Blob` from the `recordedChunks` array, specifying the MIME type (e.g., `video/webm`).
        *   Create an object URL for the Blob using `URL.createObjectURL(blob)`.
        *   Store this URL in the component's state (e.g., `downloadUrl`).
        *   Enable the "Download Recording" button.
        *   Clear the `recordedChunks` array.
    *   Set the `href` attribute of the "Download Recording" button to the `downloadUrl` from state. Add the `download` attribute with a desired filename (e.g., `recording.webm`).
    *   **Success Criteria:** After stopping recording, the "Download Recording" button becomes enabled. Clicking it downloads a playable video file (likely WebM format) of the recording.
5.  **Task SR5: Refine UI and State Management**
    *   Add clear visual indicators for recording state (e.g., text "Recording...", timer).
    *   Improve error handling and display user-friendly messages for various scenarios (API support, permissions, recording errors).
    *   Add cleanup logic (e.g., in `useEffect` cleanup function) to stop streams/recorders if the component unmounts unexpectedly.
    *   Ensure proper state reset logic allows for multiple recordings without refreshing the page.
    *   **Success Criteria:** The UI clearly shows the current status (idle, selecting, recording, stopped, ready to download). Errors are handled gracefully. The user can make multiple recordings reliably.

## Project Status Board (New Feature)

-   [ ] Task SR1: Setup Screen Recording Page & Navigation
-   [ ] Task SR2: Implement Screen Selection
-   [ ] Task SR3: Implement Start/Stop Recording Controls
-   [ ] Task SR4: Implement Download Functionality
-   [ ] Task SR5: Refine UI and State Management

## Executor's Feedback or Assistance Requests (New Feature)

*(Executor will update this section)*

## Lessons (New Feature)

*(Executor will update this section based on findings)*

---

# Feature Update: Dynamic Meeting Detail Page

## Background and Motivation

The current meeting detail page, rendered primarily by `BilingualMeeting.jsx`, uses mostly static placeholder data instead of data fetched from the backend for the specific meeting. The goal is to replace this static content with dynamic data and implement backend interactions for features like comments, topics, attendance, etc., making the page fully functional and data-driven.

## Key Challenges and Analysis

*   **Data Modeling:** Ensuring the backend database schema supports all required entities (meetings, topics, comments, documents, attendance, votes, etc.) and their relationships.
*   **API Design:** Defining clear, efficient, and secure RESTful API endpoints for fetching and manipulating meeting-related data.
*   **Frontend State Management:** Managing the loading, error, and data states for various pieces of information on the page (meeting details, comments, topics, etc.).
*   **Component Refactoring:** Modifying `BilingualMeeting.jsx` significantly to integrate fetched data and interactive functionality.
*   **Real-time Updates (Optional):** For features like comments or live transcription updates, implementing real-time communication (e.g., WebSockets) could be considered for a better user experience, but adds complexity. (Out of scope for initial implementation).
*   **Authorization:** Ensuring users can only view/interact with data related to meetings they are members of. Backend authorization checks are critical.

## High-level Task Breakdown

*(Note: B = Backend, F = Frontend)*

**Phase 1: Core Meeting Data & Read-Only Display**

1.  **Task MD1 (B): Enhance Get Meeting Endpoint:**
    *   Modify the backend model (`models/meeting.js` - `getMeetingById`) and controller (`controllers/meetingController.js` - `getMeeting`) for `GET /api/spaces/:spaceId/meetings/:meetingId`.
    *   Ensure it returns all core meeting fields needed for display: `title`, `scheduled_time`, `status`, `summary` (if available), `tasks` (if available), `recording_url` (if available). Use consistent naming (snake_case).
    *   **Success Criteria:** API call `GET /api/spaces/:spaceId/meetings/:meetingId` returns a JSON object with at least `meeting_id`, `space_id`, `title`, `scheduled_time`, `status`, `summary`, `tasks`, `recording_url`.
2.  **Task MD2 (F): Display Core Meeting Data:**
    *   Modify `BilingualMeeting.jsx`.
    *   Replace static header content (Title, Status, Date) with dynamic data from the `meeting` prop (using fields confirmed in MD1, e.g., `meeting.title`, `meeting.scheduled_time`, `meeting.status`). Format the date correctly.
    *   Display the fetched AI Summary (`meeting.summary`) and Follow-up Tasks (`meeting.tasks`) if they exist, replacing the static content. Format tasks appropriately (e.g., parsing a string list).
    *   Display the live transcription (if available, assuming a `meeting.transcript` field exists or needs to be added in MD1).
    *   Conditionally display the `<ScreenRecorder />` component, potentially passing the correct meeting ID (`meeting.meeting_id`). Ensure `onUpdateMeeting` callback works if a recording URL is added.
    *   **Success Criteria:** The meeting page header, summary, tasks, and transcription sections display data fetched from the backend for the specific meeting. The screen recorder is present.

**Phase 2: Related Data & Basic Interactions**

3.  **Task MD3 (B): Implement Attendance API:**
    *   Create backend route, controller, and model function for `GET /api/spaces/:spaceId/meetings/:meetingId/attendance`.
    *   Model function should query the database (likely joining `attendance` and `users` tables) to get a list of attendees with their presence status and user details (e.g., `user_id`, `username`, `is_present`).
    *   Ensure proper authorization (user must be member of the space).
    *   **Success Criteria:** API call `GET /api/.../attendance` returns an array of attendee objects (e.g., `[{ user_id: 1, username: 'UserA', is_present: true }, ...]`).
4.  **Task MD4 (F): Display Dynamic Attendance:**
    *   In `BilingualMeeting.jsx`, add `useEffect` hook to fetch attendance data from the API endpoint created in MD3 when the component mounts.
    *   Store attendance data in state.
    *   Replace the static `attendees` array rendering with the fetched data. Handle loading/error states.
    *   **Success Criteria:** The attendance sidebar displays the list of actual attendees fetched from the backend.
5.  **Task MD5 (B): Implement Comments API:**
    *   Create backend routes, controllers, and models for:
        *   `GET /api/spaces/:spaceId/meetings/:meetingId/comments` (fetch comments).
        *   `POST /api/spaces/:spaceId/meetings/:meetingId/comments` (add a new comment).
    *   Model should fetch/store comments linked to the `meeting_id`, including user information (user_id, username) and timestamp.
    *   Ensure proper authorization.
    *   **Success Criteria:** API endpoints for getting and adding comments are functional and return/accept appropriate JSON data (e.g., comment list, newly created comment object).
6.  **Task MD6 (F): Implement Comments Feature:**
    *   In `BilingualMeeting.jsx`, add `useEffect` to fetch comments (API from MD5).
    *   Store comments in state and display them, replacing static comment.
    *   Implement the "Add Comment" input field and button.
    *   On submit, call the `POST` comment API (from MD5), then refresh the comments list or optimistically update the UI. Handle loading/error states.
    *   **Success Criteria:** Users can view comments fetched from the backend and add new comments, which persist and are displayed.

**Phase 3: Advanced Features (Topics, Documents, Voting - Lower Priority/Optional)**

7.  **Task MD7 (B&F): Implement Topics Feature:**
    *   Backend: Create API endpoints (`GET`, `POST`, potentially `PUT`/`DELETE`) for managing topics associated with a meeting (`/api/spaces/:spaceId/meetings/:meetingId/topics`).
    *   Frontend: Fetch and display topics. Implement UI for adding/editing/deleting topics, calling the backend APIs.
    *   **Success Criteria:** Users can view, add, and potentially manage meeting topics. - Done
8.  **Task MD8 (B&F): Implement Documents Feature:**
    *   Backend: Create API endpoints for fetching documents associated with a topic/meeting (`GET`), uploading new documents (`POST` with file handling like `multer`), and deleting documents (`DELETE`). Define storage mechanism (filesystem/cloud). - Done (Upload, Get List, Get Specific, Delete)
    *   Frontend: Display list of documents per topic. Implement upload functionality (file input, API call). Implement download (link to backend serving route or direct storage link). Implement delete functionality (API call, UI update). - Done (Upload, Display, Download via Blob, Delete)
    *   **Success Criteria:** Users can view, upload, download, and delete documents associated with topics/meetings. - Done
9.  **Task MD9 (B&F): Implement Voting Feature:**
    *   Backend: Design and implement API endpoints for creating polls (`POST`), fetching polls (`GET`), fetching options (`GET`), and submitting votes (`POST`). Link polls to meetings/topics. - Done
    *   Frontend: Display polls. Implement UI for users to cast votes and potentially view results, calling backend APIs. Implement adding options. - Done (Display, Vote, Add Option)
    *   **Success Criteria:** Users can participate in voting/polls related to the meeting. - Done

*(Note: Phase 3 tasks can be broken down further if pursued)*

## Project Status Board (Dynamic Meeting Page)

-   [x] Task MD1 (B): Enhance Get Meeting Endpoint (Verified existing SELECT * likely sufficient)
-   [ ] Task MD2 (F): Display Core Meeting Data
-   [ ] Task MD3 (B): Implement Attendance API
-   [ ] Task MD4 (F): Display Dynamic Attendance
-   [ ] Task MD5 (B): Implement Comments API
-   [ ] Task MD6 (F): Implement Comments Feature
-   [ ] Task MD7 (B&F): Implement Topics Feature (Optional)
-   [ ] Task MD8 (B&F): Implement Documents Feature (Optional)
-   [ ] Task MD9 (B&F): Implement Voting Feature (Optional)

## Executor's Feedback or Assistance Requests (Dynamic Meeting Page)

- **Current Blocker:** Frontend `404` errors when fetching poll options.
- **Resolution:** Added the missing backend API route (`GET /.../polls/:pollId/options`) and corresponding controller/model logic.
- **Next Step:** Requesting user to test if poll details (options) load correctly now.

## Lessons (Dynamic Meeting Page)

*(Executor will update this section based on findings)*
