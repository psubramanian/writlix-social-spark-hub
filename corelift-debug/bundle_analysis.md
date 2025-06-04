# Bundle Size Analysis

## Issue Overview

The build produces a main JavaScript bundle (`index-DmlRhkET.js`) that is 948.38 KB (~272.22 KB gzipped), exceeding the recommended chunk size limit of 500 KB.

## Primary Contributors to Bundle Size

Based on dependencies and typical patterns, the likely contributors to the large bundle size are:

1. **UI Component Libraries**
   - Multiple Radix UI components imported independently (20+ Radix packages)
   - Each component brings its own dependencies and utilities

2. **Animation & Visualization Libraries**
   - Framer Motion (12.9.2) - Known for large bundle size
   - Recharts (2.12.7) - Chart library with many dependencies

3. **Data Management**
   - TanStack Query (React Query v5.56.2)

4. **Application Structure**
   - Lack of code splitting across routes and components
   - All components likely loaded eagerly on initial page load

## Recommended Optimizations

### Immediate Improvements

1. **Code Splitting by Route**
   ```javascript
   // Before
   import Dashboard from './components/dashboard';
   
   // After
   const Dashboard = React.lazy(() => import('./components/dashboard'));
   ```

2. **Lazy-Loading Heavy Components**
   ```javascript
   // Before
   import DataVisualization from './components/data-visualization';
   
   // After
   const DataVisualization = React.lazy(() => 
     import('./components/data-visualization')
   );
   ```

3. **Manual Chunk Configuration**
   ```javascript
   // In vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'radix-ui': [
             '@radix-ui/react-accordion',
             '@radix-ui/react-alert-dialog',
             // other radix imports
           ],
           'charts': ['recharts'],
           'animation': ['framer-motion'],
         }
       }
     }
   }
   ```

### Advanced Optimizations

1. **Tree-shaking Improvements**
   - Import only needed components from libraries
   - Replace certain libraries with lighter alternatives

2. **Bundle Analyzer Integration**
   - Keep the rollup-plugin-visualizer to monitor improvements

3. **Prefetch Strategies**
   - Implement intelligent prefetching for routes
   - Use `<link rel="prefetch">` for critical resources
