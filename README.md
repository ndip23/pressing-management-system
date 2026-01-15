# PressFlow - Laundry & Pressing Management System

PressFlow is a full-stack MERN application designed as a comprehensive Software as a Service (SaaS) platform for laundry and pressing businesses. It provides tools for business owners (Tenants) to manage their operations, customers, and orders, while also featuring a public-facing directory for end-users to discover local laundry services.

 
<!-- **Action:** Replace this with a real screenshot URL of your running application! -->

---

## ✨ Key Features

The application is divided into three main user experiences: the Public Directory, the Tenant (Business Owner) Dashboard, and the Super Admin Dashboard.

### 🧑‍🤝‍🧑 For Public Users:
-   **Business Directory:** A searchable directory of all subscribed laundry businesses.
-   **Search & Filter:** Users can search for businesses by name and filter by city.
-   **Business Profiles:** View detailed profiles for each business, including services, pricing, and contact information.

### 👔 For Tenant / Business Owners:
-   **Secure Authentication:** Tenants can register and log in to their own dedicated dashboard.
-   **Order Management:** Full CRUD (Create, Read, Update, Delete) functionality for customer orders. Track order status (e.g., Pending, Processing, Ready for Pickup).
-   **Customer Management:** Manage a list of their business's customers.
-   **Service & Pricing Management:** Define the services they offer (e.g., Washing, Ironing) and set prices.
-   **Dashboard Analytics:** An overview of key business metrics like total orders and revenue.

### 👑 For the Directory Super Admin:
-   **Secure Admin Login:** A separate, protected login for the platform administrator.
-   **Tenant Management:** View all subscribed tenant businesses, manage their subscription plans, and activate/deactivate their accounts.
-   **Manual Directory Listings:** Add or edit business listings in the public directory directly.

---

## 🛠️ Technology Stack

This project is a complete MERN stack application built with a modern and scalable toolset.

-   **Backend:**
    -   **Node.js & Express.js:** For building the robust RESTful API.
    -   **MongoDB & Mongoose:** NoSQL database for flexible data storage.
    -   **JWT (JSON Web Tokens) & bcrypt.js:** For secure, role-based authentication (Tenant vs. Super Admin).
    -   **Cloudinary:** For cloud-based image hosting and management.
    -   **Multer:** Middleware for handling file uploads.

-   **Frontend:**
    -   **React:** For building a dynamic and interactive user interface.
    -   **React Router:** For client-side routing and navigation.
    -   **Axios:** For handling API requests, with interceptors for global error and auth handling.
    -   **Context API:** For global state management (user sessions, settings).
    -   **Tailwind CSS:** For utility-first styling and responsive design.
    -   **Lucide React:** For clean and modern icons.

-   **Deployment:**
    -   **Render:** For hosting the Node.js backend.
    -   **Vercel:** For hosting the React frontend.
    -   **Monorepo Structure:** Both frontend and backend are managed in a single Git repository.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm (or yarn)
-   MongoDB Atlas account
-   Cloudinary account

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/ndip23/pressing-management-system.git
    cd pressing-management-system
    ```

2.  **Backend Setup (`server` directory):**
    -   Navigate to the server directory: `cd server`
    -   Install dependencies: `npm install`
    -   Create a `.env` file and add the following required variables:
        ```env
        MONGO_URI=your_mongodb_connection_string
        BACKEND_URL=http://localhost:5000/api
        JWT_SECRET=your_jwt_secret_key
        CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
        CLOUDINARY_API_KEY=your_cloudinary_api_key
        CLOUDINARY_API_SECRET=your_cloudinary_api_secret
        ```
    -   Start the backend server: `npm run dev`

3.  **Frontend Setup (`client` directory):**
    -   In a new terminal, navigate to the client directory: `cd client`
    -   Install dependencies: `npm install`
    -   Create a `.env` file and add the backend API URL:
        ```env
        REACT_APP_API_BASE_URL=http://localhost:5000 
        # Port must match your backend server port
        ```
    -   Start the frontend development server: `npm start`

The application should now be running, with the frontend on `http://localhost:3000` and the backend on `http://localhost:5000`.
