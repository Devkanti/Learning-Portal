# 🚀 Learning-Portal: Modern Full-Stack Learning Management System

**Welcome to EduCore-LMS!** This is a modern, end-to-end web application designed to be the central hub for educational institutions. It provides intuitive, isolated portals for students, teachers, and administrators to streamline course management, facilitate video learning, and simplify the assessment process. Built with efficiency and scalability in mind, EduCore-LMS offers a seamless digital learning experience.

---

## 💻 Technology Stack

<p align="left">
  <img src="https://img.shields.io/badge/-REACT-1e2329?style=for-the-badge&logo=react&logoColor=61dafb" alt="React" />
  <img src="https://img.shields.io/badge/-VITE-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/-TAILWINDCSS-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/-RECHARTS-22c55e?style=for-the-badge&logo=react&logoColor=white" alt="Recharts" />
</p>

* **React:** Component-based UI rendering for highly interactive dashboards.
* **Vite:** Next-generation front-end tooling for rapid development and optimized builds.
* **Tailwind CSS:** Utility-first CSS framework for a responsive, modern, and clean design system.
* **Node.js & Express:** Robust RESTful API architecture handling business logic and file uploads.
* **MongoDB & Mongoose:** Flexible NoSQL database for managing users, courses, lectures, and submissions.
* **JSON Web Tokens (JWT) & Bcrypt:** Secure, encrypted role-based authentication.

---

## ✨ Key Features & Roles

The application provides tailor-made, secure experiences based on user roles:

### 👮 Admin Portal (System Control)
* **User Management:** View, manage, and instantly remove registered students and teachers from the system.
* **Course Oversight:** Monitor all active course modules across the platform and delete obsolete or inappropriate courses.
* **Secure Access:** Strictly protected routes ensuring only authorized personnel can access global data.

### 🧑‍🏫 Teacher Portal (Educator Dashboard)
* **Module Creation:** Create comprehensive courses with descriptions, custom poster images, and structured video lectures.
* **Assessment Engine:** Attach PDF/DOCX worksheets to specific lectures and set strict submission deadlines.
* **Live Grading Desk:** * View all student submissions mapped to specific lectures.
  * Download submitted files directly.
  * Utilize an inline grading form to award scores (0-100) and provide customized feedback.
  * **Smart Missing Assignments:** Automatically detects students who failed to submit before the deadline and dynamically caps their maximum achievable score to 90.
* **Student Progress Tracking:** Live monitoring of how many video lectures each registered student has completed.

### 🧑‍🎓 Student Portal (Learning Hub)
* **Interactive Learning:** Browse enrolled courses and watch integrated MP4 video lectures.
* **Progress Tracking:** Click "Mark as Done" on videos to instantly update personal completion progress (visualized via dynamic circular progress bars).
* **Assignment Management:** Download teacher-provided worksheets and upload completed assignments.
* **Deadline Enforcement:** Visual UI badges ("X days remaining", "Due Today", "Overdue"). Forms automatically lock when a deadline passes.
* **Grade History:** A dedicated desk to review all past submissions, downloaded files, teacher scores, and private feedback.

---

## 📂 Project Structure

The project follows a clean, decoupled Client/Server architecture:

```text
Learning-Portal/
├── Backend/                    # Node.js / Express Server
│   ├── models/                 # MongoDB Schemas (User.js, Course.js, Submission.js)
│   ├── routes/                 # API Endpoints (auth.js, courses.js, admin.js)
│   ├── uploads/                # Local storage for videos, posters, and PDFs
│   ├── .env                    # Environment variables (Ports, JWT Secret, DB URI)
│   └── server.js               # Express entry point and middleware configuration
│
└── frontend/                   # React / Vite Client
    ├── public/                 # Static assets
    ├── src/
    │   ├── App.jsx             # Main router and route protection logic
    │   ├── index.css           # Global CSS and Tailwind directives
    │   ├── main.jsx            # React DOM entry
    │   └── pages/              # Role-based Dashboard Components
    │       ├── AdminDashboard.jsx
    │       ├── TeacherDashboard.jsx
    │       ├── StudentDashboard.jsx
    │       └── Login.jsx       # Authentication entry point
    ├── tailwind.config.js      # Tailwind theme and utility configuration
    └── vite.config.js          # Vite build settings
```
---

⚙️ Local Installation & Setup
Follow these instructions to get a local copy up and running.

1. Clone the repository
   
```text
git clone [https://github.com/your-username/Learning-Portal.git](https://github.com/your-username/Learning-Portal.git)
cd Learning-Portal
```
---

2. Configure Backend
Open a terminal and navigate to the backend directory:

```text
cd Backend
npm install
```

Create a .env file in the Backend folder with the following variables:

```text
node server.js
# Or use nodemon: npm run dev
```

3. Configure Frontend
Open a new terminal window and navigate to the frontend directory:

```text
cd frontend
npm install
```

Start the Vite development server:

```text
npm run dev
```

4. Access the Application
Open your browser and navigate to http://localhost:5173.
(Ensure your backend is running simultaneously on http://localhost:5000)

---

🤝 Contributing
Contributions, issues, and feature requests are welcome!

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request
