# Annex 2: Installing WireFlow on Debian 13 (Trixie) Netinst

## Prerequisites
- Debian 13 (Trixie) minimal/netinst installation (x86_64/amd64)
- Internet connection

## Step-by-Step Instructions
1. **Update your system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **Install Node.js, npm, and git:**
   ```bash
   sudo apt install -y nodejs npm git
   # For latest Node.js LTS (recommended):
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. **Clone the repository:**
   ```bash
   git clone <your-wireflow-repo-url>
   cd wireflow
   ```
4. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```
5. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```
6. **Start backend and frontend:**
   ```bash
   cd ../backend
   npm start &
   cd ../frontend
   npm run dev &
   ```
7. **Access the app:**
   Open your browser to http://localhost:5173
# WireFlow - Visual Workflow Management System

## 📋 Available Features

### Core Workflow Editing
- **Visual Node-Based Editor**: Drag-and-drop interface for creating workflow diagrams
- **Multiple Node Types**:
  - **Start Node** (Green): Entry point for workflows
  - **Task Node** (Blue): Process steps and activities
  - **Decision Node** (Yellow Diamond): Conditional branching with Yes/No paths
  - **End Node** (Red): Workflow completion points
  - **Workflow Reference Node** (Purple): Links to other workflows

### Node Management
- **Interactive Node Editing**: Click edit buttons to modify node names and descriptions
- **Real-time Form Editing**: Type directly in form fields without value resets
   - **Visual Node Connections**: Connect nodes with animated, smoothstep edges (default, not user-changeable)
- **Node Repositioning**: Drag nodes to reposition on canvas

### Workflow Operations
- **Save/Load Workflows**: Persistent storage with JSON file backend
- **Workflow Dashboard**: List view of all created workflows
- **Create New Workflows**: Start from scratch or duplicate existing ones
- **Delete Workflows**: Remove unwanted workflow definitions

### Advanced Features
- **Workflow Linking**: Reference other workflows as nodes for modular design
- **Cross-Workflow Navigation**: Open linked workflows in new tabs
- **Responsive Design**: Works on desktop and tablet devices

### User Interface
- **Node Palette**: Left sidebar with draggable node types and workflow references
- **Canvas Controls**: Zoom, pan, and minimap for large workflows
- **Edit Mode**: In-place editing with Save/Cancel options
- **Visual Feedback**: Hover states and interactive elements
- **Edge Deletion**: Select an edge and press Delete/Backspace to remove it (no custom delete buttons)

## 🛠 Tech Stack and Requirements

### Frontend Technologies
- **React 18.3.1**: Component-based UI framework
- **Vite 5.4.8**: Fast development build tool
- **React Router DOM**: Client-side routing
- **React Flow Renderer 10.3.17**: Node-based graph editing library
- **Tailwind CSS 3.4.13**: Utility-first CSS framework

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **File System Storage**: JSON file-based data persistence (in `backend/data/`)
- **CORS**: Cross-origin resource sharing support

### Development Tools
- **npm**: Package manager
- **Hot Module Replacement**: Real-time development updates
- **ESLint/Prettier**: Code quality and formatting (optional)

### System Requirements
- **Node.js 16+**: Required for both frontend and backend
- **npm 8+**: Package manager
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB recommended
- **Storage**: 500MB for installation and data

### Optional Dependencies
- **Neo4j**: Graph database (alternative to file storage)
- **Docker**: Containerization for deployment
- **PM2**: Process manager for production

## 🚀 Deploy and Install Instructions

### Prerequisites
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
2. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```

### Installation Steps

#### 1. Clone/Download Project
```bash
# Download the wireflow project to your desired location
cd /path/to/your/projects
```

#### 2. Install Backend Dependencies
```bash
cd wireflow/backend
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 4. Verify Installation
Check that both `package.json` files exist and dependencies are installed:
- `wireflow/backend/package.json`
- `wireflow/frontend/package.json`
- `wireflow/backend/node_modules/`
- `wireflow/frontend/node_modules/`

### Project Structure
```
wireflow/
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   ├── workflows/          # JSON workflow storage
│   └── node_modules/       # Backend packages
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main application
│   │   └── index.css       # Styles
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── node_modules/       # Frontend packages
└── README.md
```

### Environment Configuration
No additional environment variables are required for basic operation. The system uses:
- **Backend Port**: 5000 (configurable in `server.js`)
- **Frontend Port**: 5173 (Vite default, configurable)
- **Storage**: Local JSON files in `backend/data/`

### Production Deployment
For production deployment:

1. **Build Frontend**:
   ```bash
   cd wireflow/frontend
   npm run build
   ```

2. **Configure Backend** to serve static files:
   ```javascript
   app.use(express.static('../frontend/dist'));
   ```

3. **Use Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "wireflow-backend"
   ```

## 🎯 Launch and Use Instructions

### Starting the Application

#### 1. Start Backend Server
```bash
# Navigate to backend directory
cd wireflow/backend

# Start the server
npm start
```
**Expected Output**: `Server running on port 3000`

#### 2. Start Frontend Development Server
```bash
# Open new terminal/command prompt
cd wireflow/frontend

# Start the development server
npm run dev
```
**Expected Output**: 
```
VITE v5.4.20  ready in 846 ms
➜  Local:   http://localhost:5173/
```

#### 3. Access the Application
Open your web browser and navigate to: **http://localhost:5173**

### Using WireFlow

#### Dashboard Operations
1. **View Workflows**: See all created workflows on the main dashboard
2. **Create New Workflow**: Click "Create New Workflow" button
3. **Edit Existing**: Click on any workflow card to open in editor
4. **Delete Workflow**: Use delete button on workflow cards


#### Workflow Editor

##### Adding Nodes
1. **Drag from Palette**: Drag node types from left sidebar to canvas
2. **Position Nodes**: Drag nodes around the canvas to arrange
3. **Connect Nodes**: Drag from output handles to input handles (edges are always smoothstep style)

##### Node Types Usage
- **Start Node**: Begin every workflow with a green start node
- **Task Node**: Add blue task nodes for process steps
- **Decision Node**: Use yellow diamond nodes for branching logic
- **End Node**: Finish workflows with red end nodes
- **Workflow Link**: Reference other workflows with purple link nodes

##### Editing Nodes
1. **Click Edit Button**: Small pencil icon on hover/focus
2. **Modify Content**: Edit name and description in the form
3. **Save Changes**: Click Save button to apply changes
4. **Cancel Changes**: Click Cancel to discard edits

##### Edge Deletion
1. **Select Edge**: Click on an edge to select it (highlighted by default)
2. **Delete Edge**: Press Delete or Backspace to remove the selected edge

##### Workflow Operations
1. **Save Workflow**: Use Save button in top toolbar
2. **Navigate Back**: Return to dashboard with back button
3. **Real-time Updates**: Changes are reflected immediately

#### Advanced Usage

##### Workflow Linking
1. **Create Multiple Workflows**: Build several workflow processes
2. **Reference in Editor**: Drag workflow links from left sidebar
3. **Cross-Navigation**: Click arrow on workflow reference nodes
4. **Modular Design**: Break complex processes into smaller workflows

##### Best Practices
- **Start with Start Node**: Always begin workflows with a start node
- **Logical Flow**: Connect nodes in logical sequence
- **Clear Naming**: Use descriptive names for nodes and workflows
- **Modular Approach**: Split complex workflows into smaller, linked processes
- **Save Regularly**: Use save functionality to preserve work

### Troubleshooting

#### Common Issues
1. **Port Already in Use**: Change ports in configuration files
2. **Dependencies Missing**: Run `npm install` in both directories
3. **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)
4. **File Permissions**: Ensure write permissions for workflow storage directory

#### Development Tips
- **Hot Reload**: Frontend updates automatically during development
- **Console Logs**: Check browser console for debugging information
- **Network Tab**: Monitor API calls in browser developer tools
- **Server Logs**: Check terminal output for backend errors

### Performance Considerations
- **Large Workflows**: Performance may decrease with 100+ nodes
- **Browser Memory**: Close unused tabs when working with complex workflows
- **File Storage**: JSON files grow with workflow complexity
- **Connection Speed**: Local development provides best performance


---

# Annex 1: Installing WireFlow on a Recent Lightweight Linux Distro (e.g., Ubuntu Minimal, Alpine, Debian Netinst)

## Prerequisites
- A recent, minimal Linux installation (with sudo/root access)
- Internet connection

## Step-by-Step Instructions
1. **Update your system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   # For Alpine: sudo apk update && sudo apk upgrade
   ```
2. **Install Node.js and npm:**
   - For Ubuntu/Debian:
     ```bash
     sudo apt install -y nodejs npm git
     # Or use NodeSource for latest LTS:
     curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
     sudo apt install -y nodejs
     ```
   - For Alpine:
     ```bash
     sudo apk add nodejs npm git
     ```
3. **Clone the repository:**
   ```bash
   git clone <your-wireflow-repo-url>
   cd wireflow
   ```
4. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```
5. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```
6. **Start the backend server:**
   ```bash
   cd ../backend
   npm start &
   ```
7. **Start the frontend dev server:**
   ```bash
   cd ../frontend
   npm run dev &
   ```
8. **Access the app:**
   Open your browser to http://localhost:5173

---


## 📋 Available Features (2025)

### Core Workflow Editing
- **Visual Node-Based Editor**: Drag-and-drop interface for creating and editing workflow diagrams
- **Multiple Node Types**:
  - **Start Node** (Green): Entry point for workflows
  - **Task Node** (Blue): Process steps and activities
  - **Decision Node** (Yellow Diamond): Conditional branching with Yes/No paths
  - **End Node** (Red): Workflow completion points
  - **Workflow Reference Node** (Purple): Links to other workflows
  - **Team Assignment Node** (Teal): Assign teams directly in the workflow

### Node Management
- **Interactive Node Editing**: Click edit buttons to modify node names, descriptions, and assignments
- **Real-time Form Editing**: Type directly in form fields without value resets
- **Drag-and-Drop Team Assignment**: Assign teams to workflows by dragging team badges onto workflow cards
- **Animated, Smoothstep Edges**: All connections are animated and use smoothstep style for clarity
- **Node Repositioning**: Drag nodes to reposition on canvas

### Workflow Operations
- **Save/Load Workflows**: Persistent storage with JSON file backend
- **Workflow Dashboard**: List view of all created workflows
- **Create New Workflows**: Start from scratch or duplicate existing ones
- **Delete Workflows**: Remove unwanted workflow definitions
- **Team Assignment**: Assign teams to workflows via drag-and-drop or form selection

### Advanced Features
- **Workflow Linking**: Reference other workflows as nodes for modular design
- **Cross-Workflow Navigation**: Open linked workflows in new tabs
- **Team and Owner Management**: Manage teams and owners from the dashboard
- **Tagging**: Add tags to workflows for organization and filtering
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### User Interface
- **Node Palette**: Left sidebar with draggable node types, workflow references, and team badges
- **Canvas Controls**: Zoom, pan, and minimap for large workflows
- **Edit Mode**: In-place editing with Save/Cancel options
- **Visual Feedback**: Hover states and interactive elements
- **Edge Deletion**: Select an edge and press Delete/Backspace to remove it (no custom delete buttons)

## 🆕 Updated Guides (2025)

### New Features & Improvements
- **Drag-and-Drop Team Assignment**: Assign teams to workflows by dragging team badges onto workflow cards in the dashboard.
- **Team/Owner/Tag Management**: Add, edit, and remove teams, owners, and tags from the dashboard sidebar.
- **Workflow Tagging**: Drag tags onto workflow cards to quickly categorize workflows.
- **Improved Mobile Support**: UI adapts for mobile and tablet screens.
- **Performance Optimizations**: Faster loading and editing for large workflows (100+ nodes).
- **Enhanced Error Handling**: Clearer error messages and troubleshooting tips in the UI.

### Quick Start for New Features
1. **Assign a Team**: Drag a team badge from the sidebar onto a workflow card to assign it.
2. **Add Tags**: Drag a tag onto a workflow card to categorize it.
3. **Manage Teams/Owners/Tags**: Use the sidebar managers to add or remove teams, owners, and tags.
4. **Link Workflows**: Use the Workflow Reference Node to modularize complex processes.
5. **Mobile Editing**: Try editing workflows on a tablet or phone for a responsive experience.

---

# Annex 3: Installing WireFlow on CentOS 7.9.2009

## Prerequisites
- CentOS 7.9.2009 (x86_64)
- Internet connection

## Step-by-Step Instructions
1. **Update your system:**
   ```bash
   sudo yum update -y
   sudo yum install -y epel-release
   ```
2. **Install Node.js and npm (NodeSource recommended):**
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
   sudo yum install -y nodejs git
   ```
3. **Clone the repository:**
   ```bash
   git clone <your-wireflow-repo-url>
   cd wireflow
   ```
4. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```
5. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```
6. **Start backend and frontend:**
   ```bash
   cd ../backend
   npm start &
   cd ../frontend
   npm run dev &
   ```
7. **Access the app:**
   Open your browser to http://localhost:5173
