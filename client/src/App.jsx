import './App.css';
import GetStarted from './pages/GetStarted';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Chat = lazy(() => import('./pages/Chat'));

function App() {
    return (
        <>
            <Suspense fallback={<h1>Loading...</h1>}>
                <Routes>
                    <Route exact path="/" element={<GetStarted />} />
                    <Route exact path="/users/signup" element={<SignUp />} />
                    <Route exact path="/users/login" element={<Login />} />
                    <Route exact path="/chat" element={<Chat />} />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
