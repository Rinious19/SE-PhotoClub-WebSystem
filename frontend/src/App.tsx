//? Component: App Wrapper
//@ ไฟล์รวม Provider ทั้งหมดของแอปพลิเคชัน

import { AuthProvider } from '@/context/AuthContext';
import { AppRouter } from '@/routes/AppRouter';
import 'bootstrap/dist/css/bootstrap.min.css'; // Side effect import สำหรับ CSS (อนุญาตตามความจำเป็น)

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;