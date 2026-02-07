# Enterprise Resource Planning (ERP) System

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![Electron](https://img.shields.io/badge/Electron-Build_Cross_Platform_Desktop_Apps-47848F?style=flat&logo=electron)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

This is a comprehensive desktop-based **Customer, Inventory, and Sales Management System** built with modern web technologies and wrapped in Electron for cross-platform performance. It is designed to streamline business operations, from tracking stock to managing customer relationships and generating detailed financial reports.

## 🚀 Key Features

*   **🔐 Authentication & Security**: Secure user login and registration system using JWT and role-based access control.
*   **📊 Interactive Dashboard**: Real-time overview of business performance, including sales metrics, expense tracking, and quick actions.
*   **📦 Inventory Management**: Complete control over products, stock levels, categories, and low-stock alerts.
*   **🧾 Invoicing & Sales**: Generate professional invoices, track sales history, and manage orders efficiently.
*   **👥 Customer Management**: Maintain a detailed database of customers, their purchase history, and contact details.
*   **💸 Expense Tracking**: Monitor business expenses to maintain financial health.
*   **📈 Reports & Analytics**: Generate comprehensive reports (PDF/Excel) to analyze business growth and trends.
*   **⚙️ Business Settings**: Customizable profile setup to tailor the application to your specific business needs.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) & [React Query](https://tanstack.com/query/latest)
*   **UI Components**: Radix UI, Lucide React
*   **Charts**: Recharts
*   **Forms**: React Hook Form

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)
*   **ORM**: [Sequelize](https://sequelize.org/)
*   **Tools**: Puppeteer (PDF generation), ExcelJS (Data export), Multer (File uploads)

### Desktop Wrapper
*   **Engine**: [Electron](https://www.electronjs.org/)
*   **Builder**: Electron Builder

## 🏁 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) installed and running locally, or a remote database URL.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/PhineasCane/enterprise.git
    cd enterprise
    ```

2.  **Install dependencies**
    This project has a root `package.json` that orchestrates both frontend and backend.
    ```bash
    npm install
    cd frontend && npm install
    cd ../backend && npm install
    cd ..
    ```

3.  **Database Configuration**
    
    > **⚠️ Important**: The project currently uses a configuration file at `backend/src/config/index.js`. 
    
    For best security practices, you should use environment variables.
    
    1.  Create a `.env` file in the `backend` directory.
    2.  Add your database credentials and secrets:
        ```env
        PORT=5000
        DATABASE_URL=postgres://user:password@localhost:5432/enterprise_db
        JWT_SECRET=your_super_secret_key
        JWT_EXPIRES_IN=7d
        ```
    3.  Update `backend/src/config/index.js` to use `process.env` variables instead of hardcoded strings.

4.  **Run Migrations** (If applicable)
    Ensure your PostgreSQL database is running and reachable. Sequelize will handle table creation on startup in development mode.

### 🏃‍♂️ Running the Application

To start the application in development mode (running Backend, Frontend, and Electron concurrently):

```bash
npm run dev
```

*   **Backend** runs on `http://localhost:5000`
*   **Frontend** runs via Vite (typically `http://localhost:5173`)
*   **Electron** window will launch automatically.

## 📂 Project Structure

```
enterprise/
├── assets/             # Static assets
├── backend/            # Express server & API
│   ├── src/
│   │   ├── config/     # DB & App config
│   │   ├── controllers/# Route logic
│   │   ├── models/     # Sequelize models
│   │   ├── routes/     # API endpoints
│   │   └── ...
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application views
│   │   ├── store/      # Redux state
│   │   └── ...
├── main.js             # Electron main process
└── package.json        # Root scripts
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

Based on the work of **Phineas Njoroge**.
