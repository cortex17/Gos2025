# 🚨 SOSMap - Safety Incident Reporting Platform

**Full-Stack Web Technologies Final Exam Project (Frontend Track)**

A modern React SPA for reporting safety incidents, SOS alerts, and real-time monitoring with User and Admin roles.

## 📋 Project Overview

SOSMap is a comprehensive safety reporting platform that allows users to:
- Report safety incidents (lighting issues, stray dogs, slippery surfaces, etc.)
- Send SOS alerts in emergency situations
- View real-time incident maps with clustering
- Vote on incident authenticity
- Monitor proximity alerts for nearby dangers
- Admin panel for incident moderation and user management

## 🎯 Requirements Compliance

### ✅ Framework (Mandatory)
- **React 18** with TypeScript
- **Vite** as build tool

### ✅ Routing (4-5+ pages)
- `/login` - Authentication page
- `/pulse` - Safety Pulse dashboard (public)
- `/dashboard` - User map dashboard
- `/reports` - Reports list page
- `/report/:id` - Report detail page
- `/report/new` - Create new report
- `/profile` - User profile page
- `/admin` - Admin moderation panel

### ✅ State Management
- **Zustand** for authentication state
- **TanStack React Query** for server state and caching

### ✅ API Communication
- **Axios** for HTTP requests
- Full CRUD operations (Create, Read, Update, Delete)
- Token-based authentication
- Protected routes with role-based access

### ✅ Form Validation
- Login/Register forms with validation
- Report creation form
- Error handling and user feedback

### ✅ UI/UX
- **Material-UI (MUI)** component library
- **Framer Motion** for animations
- **GSAP** for advanced animations
- Responsive design (mobile-first)
- Modern gradient designs

### ✅ Token Handling
- JWT tokens stored in `localStorage`
- Protected routes (User & Admin)
- Automatic token refresh on 401 errors

### ✅ User & Admin Roles
- **User Role**: Create reports, vote, view incidents, SOS alerts
- **Admin Role**: Moderate reports, manage users, view analytics, block/unblock users

## 🚀 Live Demo

**Frontend:** [Deploy to Vercel/Netlify] (Add your deployment URL)

**Backend API:** [Your backend URL] (Optional - can use mock API)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd SOSMap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create `.env` file in root directory:

```env
# For production (real backend)
VITE_API_BASE_URL=https://your-backend-url.com
VITE_USE_FAKE_API=false

# For development (mock API)
# VITE_API_BASE_URL=http://localhost:8000
# VITE_USE_FAKE_API=true
```

### 4. Run Development Server
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

Output will be in `dist/` folder, ready for deployment.

## 🎨 Features

### Core Features
- ✅ **Incident Reporting**: Create, view, and manage safety incidents
- ✅ **Interactive Map**: Leaflet map with marker clustering
- ✅ **SOS Alerts**: Emergency alert system with proximity detection
- ✅ **Real-time Updates**: WebSocket integration for live notifications
- ✅ **Voting System**: Users can confirm or flag incidents as fake
- ✅ **Reputation System**: User reputation affects report creation permissions
- ✅ **Search & Filter**: Filter incidents by type, severity, location
- ✅ **Admin Panel**: Full moderation tools, user management, analytics

### Advanced Features
- 🎭 **Animations**: GSAP page transitions, Framer Motion components
- 🗺️ **Map Features**: Clustering, proximity alerts, route visualization
- 🔔 **Notifications**: Toast notifications, WebSocket real-time alerts
- 📱 **Responsive**: Mobile-first design, works on all devices
- 🎨 **Modern UI**: Gradient designs, glassmorphism effects

## 📁 Project Structure

```
SOSMap/
├── src/
│   ├── api/              # API clients and adapters
│   ├── app/              # Router, guards, layout
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   ├── store/            # Zustand stores
│   └── theme.ts          # MUI theme configuration
├── public/               # Static assets
├── .env                  # Environment variables
├── package.json
└── README.md
```

## 🔐 Authentication

### Test Credentials (if using backend)

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**User:**
- Email: `user@example.com`
- Password: `user123`

*Note: Credentials depend on your backend setup*

## 🔌 API Integration

### Using Real Backend
1. Set `VITE_USE_FAKE_API=false` in `.env`
2. Configure `VITE_API_BASE_URL` to your backend URL
3. Ensure backend is running and accessible

### Using Mock API (Default)
- Works without backend
- Data stored in `localStorage`
- Perfect for demonstration
- Set `VITE_USE_FAKE_API=true` or leave unset

See `API.md` for complete API documentation.

## 📱 Pages & Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Redirects to `/pulse` | Public |
| `/pulse` | Safety Pulse dashboard | Public |
| `/login` | Login/Register page | Public |
| `/dashboard` | Interactive map | User+ |
| `/reports` | Reports list | User+ |
| `/report/:id` | Report details | User+ |
| `/report/new` | Create report | User+ |
| `/profile` | User profile | User+ |
| `/admin` | Admin panel | Admin only |

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Zustand** - State management
- **TanStack React Query** - Server state
- **Material-UI (MUI)** - UI components
- **Axios** - HTTP client
- **Leaflet** - Maps
- **Framer Motion** - Animations
- **GSAP** - Advanced animations

## 📊 Evaluation Criteria Compliance

### ✅ Technical Requirements (100 points)
- [x] Framework: React with TypeScript
- [x] Routing: 8+ pages with protected routes
- [x] State Management: Zustand + React Query
- [x] API Communication: Axios with full CRUD
- [x] Form Validation: All forms validated
- [x] UI/UX: MUI with responsive design
- [x] Token Handling: localStorage with auto-refresh
- [x] User & Admin Roles: Distinct interfaces

### ✅ Feature Requirements
- [x] Main Entity: Safety Incidents/Reports
- [x] CRUD Operations: Full Create, Read, Update, Delete
- [x] Table/Card View: Both views implemented
- [x] Search/Filter: By type, severity, location
- [x] Modal Forms: Report creation, auth modals
- [x] User Profile: Complete profile page
- [x] Admin Panel: Full moderation tools
- [x] Notifications: Toast + WebSocket alerts
- [x] Loading States: Skeleton loaders, spinners
- [x] Error Handling: Comprehensive error states

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### GitHub Pages
```bash
npm install -D gh-pages
# Add to package.json:
# "deploy": "npm run build && gh-pages -d dist"
npm run deploy
```

## 📝 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Component-based architecture
- Clean code practices

## 🤝 Contributing

This is a final exam project. For questions or issues, please contact the developer.

## 📄 License

This project is created for educational purposes as part of Full-Stack Web Technologies course.

## 👨‍💻 Author

**Student Name**  
Full-Stack Web Technologies Final Exam Project  
Deadline: 17.12.2025

---

## 📸 Screenshots

*Add screenshots of your application here*

## 🎯 Project Highlights

- ✅ Fully functional SPA with 8+ pages
- ✅ Complete CRUD operations via API
- ✅ User and Admin role separation
- ✅ Real-time features (WebSocket)
- ✅ Modern animations and UX
- ✅ Responsive design
- ✅ Production-ready code
- ✅ Comprehensive error handling
- ✅ Loading and empty states
- ✅ Deployable to Vercel/Netlify

---

**Ready for Final Exam Defense! 🎓**
