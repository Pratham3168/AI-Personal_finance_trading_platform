// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
// import App from './App.jsx'
// import { AuthProvider } from './context/AuthContext.jsx'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <AuthProvider>
//         <App />
//       </AuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>
// )


import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LazyMotion, MotionConfig } from 'motion/react'
import '@fontsource-variable/inter'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ConfirmProvider } from './components/ConfirmProvider.jsx'
import AppToaster from './components/AppToaster.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LazyMotion features={() => import('./motionFeatures.js').then((mod) => mod.default)} strict>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ConfirmProvider>
            <AuthProvider>
              <App />
              <AppToaster />
            </AuthProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </MotionConfig>
      </LazyMotion>
    </BrowserRouter>
  </React.StrictMode>
)
