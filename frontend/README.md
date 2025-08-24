# AutoExtract Frontend

A modern, professional web application for AI-powered data extraction from charts and graphs, built with React and a unified design system.

## 🚀 Features

- **AI-Powered Detection** - Automatic chart element recognition
- **Interactive Editing** - Fine-tune detection boxes and categories
- **Data Extraction** - Calculate bar heights and export results
- **Professional UI** - Unified design system across all pages
- **Responsive Design** - Optimized for all device sizes
- **Video Tutorials** - Step-by-step learning experience

## 🎨 Design System

This project follows a comprehensive design system documented in `UI_DESIGN_SYSTEM.md`. The system ensures:

- **Unified Aesthetic** - Consistent appearance across all pages
- **Professional Look** - Modern design that builds trust
- **Accessibility** - High contrast and readable typography
- **Responsive Design** - Mobile-first approach
- **Performance** - Optimized CSS and animations

### Key Design Principles

1. **Clarity and Readability** - Easy-to-scan layouts with clear hierarchy
2. **Professional Appearance** - Building trust through polished design
3. **Consistent Experience** - Unified patterns across all components
4. **Accessibility** - High contrast and readable typography
5. **Responsive Design** - Optimized for all device sizes

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── BarAnalyzer.jsx # Main analyzer component
│   │   ├── FileUpload.jsx  # File upload component
│   │   ├── ValueEditor.jsx # Value editing component
│   │   ├── SelectionInfo.jsx # Selection information
│   │   └── CanvasViewer.jsx # Canvas viewer component
│   ├── hooks/              # Custom React hooks
│   │   └── useCanvasManager.js # Canvas management hook
│   ├── services/           # API and utility services
│   │   ├── apiService.js   # Backend API calls
│   │   └── syncService.js  # Synchronization service
│   ├── App.jsx             # Main application component
│   ├── index.css           # Global styles and design system
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
│   └── videos/             # Tutorial video files (to be added)
├── UI_DESIGN_SYSTEM.md     # Complete design system documentation
└── README.md               # This file
```

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Bootstrap 5** - CSS framework for responsive layouts
- **Bootstrap Icons** - Icon library
- **Fabric.js** - Canvas manipulation library
- **Inter Font** - Modern, readable typography

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AutoExtract/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Pages & Navigation

### Home Page (`/`)
- **Hero Section** - Introduction and main call-to-action
- **Features Grid** - Overview of analyzer capabilities
- **Quick Start Guide** - Getting started options
- **Statistics** - Key metrics and achievements

### Tutorial Page (`/tutorial`)
- **9-Step Tutorial** - Comprehensive learning experience
- **Video Integration** - Placeholder for tutorial videos
- **Interactive Navigation** - Step-by-step progression
- **Progress Tracking** - Visual completion indicators

### Bar Analyzer (`/bar_analyzer`)
- **File Upload** - Image upload and analysis
- **Interactive Canvas** - Detection box manipulation
- **Value Editor** - Y-axis scale configuration
- **Results Display** - Data extraction and export

## 🎬 Video Tutorial Integration

The tutorial system is designed to include short, looping videos for each step:

### Video Requirements
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 or 1280x720
- **Duration**: 15-25 seconds per video
- **Content**: Step-by-step demonstrations

### Video Files Structure
```
public/videos/
├── welcome-overview.mp4
├── upload-detection.mp4
├── ai-detection.mp4
├── interactive-editing.mp4
├── fine-tuning.mp4
├── reference-values.mp4
├── calculate-heights.mp4
├── export-data.mp4
└── troubleshooting.mp4
```

### Adding Videos
1. **Record your tutorial videos** following the specifications
2. **Convert to MP4 format** and optimize for web
3. **Place in `public/videos/`** folder
4. **Restart development server** to see changes

## 🎨 Customizing the Design

### Color Palette
The design system uses CSS custom properties for easy customization:

```css
:root {
  --primary-color: #3498db;      /* Main brand blue */
  --secondary-color: #2ecc71;    /* Success green */
  --accent-color: #e74c3c;      /* Warning/error red */
  --text-primary: #2c3e50;      /* Main text color */
  --text-secondary: #7f8c8d;    /* Secondary text */
}
```

### Spacing System
Consistent spacing using CSS variables:

```css
:root {
  --spacing-xs: 0.5rem;    /* 8px */
  --spacing-sm: 1rem;      /* 16px */
  --spacing-md: 1.5rem;    /* 24px */
  --spacing-lg: 2rem;      /* 32px */
  --spacing-xl: 3rem;      /* 48px */
  --spacing-xxl: 4rem;     /* 64px */
}
```

### Typography
The system uses Inter font family with consistent sizing:

```css
h1 { font-size: 3.2em; }  /* Page titles */
h2 { font-size: 2.5em; }  /* Section titles */
h3 { font-size: 2em; }    /* Subsection titles */
h4 { font-size: 1.5em; }  /* Card titles */
```

## 🔧 Development Guidelines

### CSS Organization
1. **Variables first** - Define all CSS custom properties
2. **Global styles** - Base typography, buttons, forms
3. **Component styles** - Cards, alerts, badges
4. **Page-specific styles** - Home, tutorial, analyzer
5. **Responsive styles** - Media queries at the end

### Component Structure
- **Functional components** with React hooks
- **Custom hooks** for complex logic
- **Service layer** for API calls
- **Consistent naming** conventions

### Code Quality
- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **Component documentation** with JSDoc
- **Accessibility** compliance

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px and above
- **Tablet**: 768px to 1199px
- **Mobile**: 576px to 767px
- **Small Mobile**: Below 576px

### Responsive Features
- **Mobile-first** approach
- **Flexible layouts** that adapt to screen size
- **Touch-friendly** controls for mobile devices
- **Optimized typography** scaling

## 🚀 Deployment

### Build Process
```bash
npm run build
```

The build process:
1. **Compiles React components** to optimized JavaScript
2. **Processes CSS** with design system variables
3. **Optimizes assets** for production
4. **Generates static files** in `dist/` folder

### Deployment Options
- **Static hosting** (Netlify, Vercel, GitHub Pages)
- **Traditional web server** (Apache, Nginx)
- **CDN deployment** for global performance

## 🤝 Contributing

### Development Workflow
1. **Create feature branch** from main
2. **Follow design system** guidelines
3. **Test responsive behavior** on multiple devices
4. **Ensure accessibility** compliance
5. **Submit pull request** with description

### Design System Compliance
- **Use established color palette**
- **Follow spacing guidelines**
- **Apply consistent typography**
- **Include hover states and transitions**
- **Test responsive behavior**

## 📚 Additional Resources

- **UI Design System** - Complete design documentation
- **Bootstrap Documentation** - CSS framework reference
- **React Documentation** - Component development guide
- **Fabric.js Documentation** - Canvas manipulation library

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
- **Node version**: Ensure Node.js 16+ is installed
- **Dependencies**: Run `npm install` to resolve missing packages
- **Port conflicts**: Change port in `vite.config.js` if needed

#### Styling Issues
- **CSS variables**: Check that all custom properties are defined
- **Bootstrap conflicts**: Ensure proper import order
- **Responsive issues**: Test on different screen sizes

#### Component Issues
- **Hook dependencies**: Check useEffect dependency arrays
- **State management**: Verify state updates and re-renders
- **API calls**: Check network requests and error handling

## 📄 License

This project is part of the AutoExtract application. Please refer to the main repository for license information.

---

*For detailed design system information, see `UI_DESIGN_SYSTEM.md`*
