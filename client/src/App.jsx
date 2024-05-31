import './App.css';
import GetStarted from './pages/GetStarted';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Settings from './pages/Settings';
const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Chat = lazy(() => import('./pages/Chat'));

function App() {
    return (
        <>
            <Suspense fallback={<h1>Loading...</h1>}>
                <Routes>
                    <Route exact path="/" element={<GetStarted />} />
                    <Route exact path="/user/signup" element={<SignUp />} />
                    <Route exact path="/user/login" element={<Login />} />
                    <Route exact path="/chat" element={<Chat />} />
                    <Route exact path="/user/settings" element={<Settings />} />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
