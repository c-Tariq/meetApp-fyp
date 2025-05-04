import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Spaces from './pages/spaces/Spaces';
import SpaceDetail from './pages/spaces/SpaceDetail';
import MeetingDetail from './pages/meetings/MeetingDetail';
import Navbar from './components/common/Navbar';
import AcceptInvitation from './pages/auth/AcceptInvitation';
import ScreenRecorder from "./components/meetings/ScreenRecorder";



function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
        <Routes> {/* [cite: 281] */}
            <Route path="/login" element={<Login />} /> {/* [cite: 281] */}
            <Route path="/register" element={<Register />} /> {/* [cite: 281] */}
            {/* Add the new route */}
            <Route path="spaces/:spaceId/members/accept/:token" element={<AcceptInvitation />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <Spaces />
                  </div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/spaces/:spaceId"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <SpaceDetail />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/spaces/:spaceId/meetings/:meetingId"
              element={
                <PrivateRoute>
                  <div>
                    <MeetingDetail />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/recording"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <ScreenRecorder />
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
