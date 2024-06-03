import GetStarted from './pages/GetStarted';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Settings from './pages/Settings';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from './components/Loading';
const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Chat = lazy(() => import('./pages/Chat'));
const Pricing = lazy(() => import('./pages/Pricing'));

function App() {
    const jwt = localStorage.getItem('jwt');

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64); // Decodes a string of Base64-encoded data into bytes
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now().valueOf() / 1000;
        return now > exp;
    }

    const isLoggedIn = () => {
        const token = jwt;
        return token != null && !isTokenExpired(token);
    };

    return (
        <>
            <Suspense fallback={<Loading/>}>
                <Routes>
                    <Route exact path="/" element={<GetStarted />} />
                    <Route exact path="/user/signup" element={<SignUp />} />
                    <Route exact path="/user/login" element={<Login />} />
                    <Route exact path="/chat" element={<Chat />} />
                    <Route exact path="/chat/:id" element={<Chat />} />
                    <Route exact path="/user/settings" element={<Settings />} />
                    <Route exact path="/pricing" element={<Pricing />} />
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
