import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

//นำเข้า Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'

//เพิ่มบรรทัดนี้เข้าไป เพื่อเรียกใช้ Dark Theme
//import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
