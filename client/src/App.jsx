import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from './components/Loading';
import OAuthCallback from './components/OAuthCallback';
import './App.css';
import GetStarted from './pages/GetStarted';
import NotFound from './pages/404';
const Settings = lazy(() => import('./pages/Settings'));
const Chat = lazy(() => import('./pages/Chat'));
const Pricing = lazy(() => import('./pages/Pricing'));

function App() {
    return (
        <>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route exact path="/" element={<GetStarted />} />
                    <Route
                        path="/user/auth/callback"
                        element={<OAuthCallback />}
                    />
                    <Route exact path="/chat" element={<Chat />} />
                    <Route exact path="/chat/:id" element={<Chat />} />
                    <Route exact path="/user/settings" element={<Settings />} />
                    <Route exact path="/pricing" element={<Pricing />} />
                    <Route exact path="*" element={<NotFound />} />
                </Routes>
                <ToastContainer
                    position="top-right"
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                    transition={Slide}
                />
            </Suspense>
        </>
    );
}

export default App;
