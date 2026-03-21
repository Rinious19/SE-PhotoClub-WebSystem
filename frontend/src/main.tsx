import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

<<<<<<< HEAD
import 'bootstrap/dist/css/bootstrap.min.css'

=======
//นำเข้า Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'

//เพิ่มบรรทัดนี้เข้าไป เพื่อเรียกใช้ Dark Theme
//import './index.css'

>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
