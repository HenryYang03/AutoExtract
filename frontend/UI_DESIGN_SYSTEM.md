# AutoExtract UI Design System

## 🎨 Design Philosophy

AutoExtract follows a **modern, professional, and unified design approach** that emphasizes:
- **Clarity and Readability** - Easy-to-scan layouts with clear hierarchy
- **Professional Appearance** - Building trust through polished design
- **Consistent Experience** - Unified patterns across all pages
- **Accessibility** - High contrast and readable typography
- **Responsive Design** - Optimized for all device sizes

## 🌈 Color Palette - Academic Research System

### Primary Colors (Minimal, Professional)
```css
--primary-color: #2C3E50      /* Deep charcoal - primary actions */
--primary-dark: #1B2631      /* Darker charcoal - hover states */
--primary-light: #34495E      /* Lighter charcoal - secondary actions */
```

### Secondary Colors (Neutral Grays)
```css
--secondary-color: #7F8C8D    /* Medium gray - secondary elements */
--secondary-dark: #5D6D7E     /* Darker gray - emphasis */
--secondary-light: #BDC3C7    /* Light gray - subtle elements */
```

### Accent Colors (Minimal Highlights)
```css
--accent-color: #95A5A6      /* Muted blue-gray - subtle highlights */
--accent-dark: #7F8C8D       /* Deeper blue-gray - important info */
--accent-light: #BDC3C7      /* Very light blue-gray - backgrounds */
```

### Text Colors (High Contrast, Academic)
```css
--text-primary: #2C3E50      /* Deep charcoal - main text */
--text-secondary: #34495E    /* Medium charcoal - secondary text */
--text-muted: #7F8C8D       /* Light gray - muted text */
```

### Background Colors (Clean, Professional)
```css
--background-light: #F8F9FA  /* Very light gray - subtle backgrounds */
--background-white: #FFFFFF   /* Pure white - main backgrounds */
--background-dark: #2C3E50   /* Deep charcoal - dark elements */
```

### Border & Shadow Colors (Subtle, Professional)
```css
--border-color: #E9ECEF      /* Light gray - borders */
--border-light: #F1F3F4      /* Very light gray - subtle borders */
--shadow-light: rgba(44, 62, 80, 0.05)    /* Very subtle shadows */
--shadow-medium: rgba(44, 62, 80, 0.08)   /* Medium shadows */
--shadow-heavy: rgba(44, 62, 80, 0.12)    /* Strong shadows */
```

## 📏 Spacing System

### Spacing Scale
```css
--spacing-xs: 0.5rem    /* 8px - Minimal spacing */
--spacing-sm: 1rem      /* 16px - Small spacing */
--spacing-md: 1.5rem    /* 24px - Medium spacing */
--spacing-lg: 2rem      /* 32px - Large spacing */
--spacing-xl: 3rem      /* 48px - Extra large spacing */
--spacing-xxl: 4rem     /* 64px - Maximum spacing */
```

### Usage Guidelines
- **Component padding**: Use `--spacing-lg` to `--spacing-xl`
- **Section margins**: Use `--spacing-xl` to `--spacing-xxl`
- **Element spacing**: Use `--spacing-sm` to `--spacing-md`
- **Minimal gaps**: Use `--spacing-xs` for tight spacing

## 🔲 Border Radius System

### Radius Scale
```css
--border-radius-sm: 8px   /* Small elements, buttons */
--border-radius-md: 12px  /* Cards, panels */
--border-radius-lg: 16px  /* Large cards, sections */
--border-radius-xl: 24px  /* Hero sections, major containers */
```

### Application Rules
- **Buttons**: `--border-radius-sm`
- **Cards**: `--border-radius-md` to `--border-radius-lg`
- **Hero sections**: `--border-radius-xl`
- **Form inputs**: `--border-radius-sm`

## 🔤 Typography System

### Font Family
```css
font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Weights
- **300**: Light text, captions
- **400**: Body text, regular content
- **500**: Medium emphasis, links
- **600**: Semi-bold, headings
- **700**: Bold, main titles

### Heading Scale
```css
h1 { font-size: 3.2em; line-height: 1.3; }  /* Page titles */
h2 { font-size: 2.5em; line-height: 1.3; }  /* Section titles */
h3 { font-size: 2em; line-height: 1.3; }    /* Subsection titles */
h4 { font-size: 1.5em; line-height: 1.3; }  /* Card titles */
h5 { font-size: 1.25em; line-height: 1.3; } /* Small titles */
h6 { font-size: 1.1em; line-height: 1.3; }  /* Micro titles */
```

### Text Colors
- **Headings**: `--text-primary`
- **Body text**: `--text-secondary`
- **Links**: `--primary-color`
- **Emphasis**: `--text-primary` with `font-weight: 600`

## 🎯 Component Guidelines

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 0.75em 1.5em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-medium);
}
```

#### Outline Button
```css
.btn-outline-primary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--border-radius-sm);
  padding: 0.75em 1.5em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-medium);
}
```

#### Button Sizes
- **Default**: `padding: 0.75em 1.5em`
- **Large**: `padding: 1rem 2rem`, `font-size: 1.1rem`
- **Small**: `padding: 0.5rem 1rem`, `font-size: 0.9rem`

### Cards

#### Basic Card
```css
.card {
  border: none;
  border-radius: var(--border-radius-md);
  box-shadow: 0 4px 20px var(--shadow-light);
  transition: all 0.3s ease;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px var(--shadow-medium);
}
```

#### Card Header
```css
.card-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  padding: var(--spacing-lg);
  font-weight: 600;
}
```

#### Card Body
```css
.card-body {
  padding: var(--spacing-xl);
}
```

### Gradient Headers

#### Primary Gradient
```css
.bg-gradient-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
}
```

#### Success Gradient
```css
.bg-gradient-success {
  background: linear-gradient(135deg, var(--secondary-color), #27ae60) !important;
}
```

#### Info Gradient
```css
.bg-gradient-info {
  background: linear-gradient(135deg, #3498db, #2980b9) !important;
}
```

#### Warning Gradient
```css
.bg-gradient-warning {
  background: linear-gradient(135deg, #f39c12, #e67e22) !important;
}
```

### Alerts

#### Alert Base
```css
.alert {
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  font-weight: 500;
}
```

#### Alert Variants
```css
.alert-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.alert-success {
  background: linear-gradient(135deg, var(--secondary-color), #27ae60);
  color: white;
}

.alert-warning {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.alert-info {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}
```

### Badges

#### Badge Base
```css
.badge {
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
}
```

#### Badge Variants
```css
.badge.bg-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
}

.badge.bg-success {
  background: linear-gradient(135deg, var(--secondary-color), #27ae60) !important;
}

.badge.bg-warning {
  background: linear-gradient(135deg, #f39c12, #e67e22) !important;
  color: white !important;
}
```

## 🎨 Page Layout Patterns

### Hero Section
```css
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xxl) 0;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}
```

### Feature Cards
```css
.feature-card {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 20px var(--shadow-light);
  height: 100%;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px var(--shadow-medium);
  border-color: var(--primary-color);
}
```

### Section Spacing
```css
.section {
  margin-bottom: var(--spacing-xxl);
}

.section-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.section-content {
  margin-bottom: var(--spacing-lg);
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Tablet */
@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
  .hero-subtitle { font-size: 1.5rem; }
  .card-body { padding: var(--spacing-lg); }
}

/* Mobile */
@media (max-width: 576px) {
  .hero-title { font-size: 2rem; }
  .hero-subtitle { font-size: 1.25rem; }
  .container { padding: 0 var(--spacing-sm); }
}
```

### Responsive Guidelines
- **Typography**: Scale down proportionally on smaller screens
- **Spacing**: Reduce margins and padding on mobile
- **Layouts**: Stack elements vertically on small screens
- **Buttons**: Full-width buttons on mobile for better touch targets

## 🎭 Animation & Transitions

### Hover Effects
```css
/* Button hover */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-medium);
}

/* Card hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px var(--shadow-medium);
}

/* Feature card hover */
.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px var(--shadow-medium);
}
```

### Transition Timing
```css
transition: all 0.3s ease;  /* Standard transition */
transition: all 0.2s ease;  /* Fast transition for buttons */
transition: all 0.5s ease;  /* Slow transition for major changes */
```

### Loading States
```css
.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## 🔧 Implementation Guidelines

### CSS Organization
1. **Variables first** - Define all CSS custom properties at the top
2. **Global styles** - Base typography, buttons, forms
3. **Component styles** - Cards, alerts, badges
4. **Page-specific styles** - Home, tutorial, analyzer
5. **Responsive styles** - Media queries at the end

### Class Naming Convention
- **Component classes**: `.component-name` (e.g., `.feature-card`)
- **Modifier classes**: `.component-name--modifier` (e.g., `.btn--large`)
- **Utility classes**: `.utility-name` (e.g., `.text-center`)

### Accessibility Considerations
- **Color contrast**: Ensure sufficient contrast ratios
- **Focus states**: Clear focus indicators for keyboard navigation
- **Text sizing**: Maintain readable font sizes
- **Touch targets**: Adequate size for mobile interactions

## 📋 Component Checklist

### Before Implementing a New Component
- [ ] Follow the established color palette
- [ ] Use consistent spacing values
- [ ] Apply appropriate border radius
- [ ] Include hover states and transitions
- [ ] Test responsive behavior
- [ ] Ensure accessibility compliance
- [ ] Match existing typography patterns

### Quality Standards
- **Visual consistency** with existing components
- **Smooth animations** with appropriate timing
- **Professional appearance** that builds trust
- **Mobile-first** responsive design
- **Performance optimized** CSS and animations

---

*This design system ensures a unified, professional appearance across all AutoExtract pages while maintaining flexibility for future enhancements.*
