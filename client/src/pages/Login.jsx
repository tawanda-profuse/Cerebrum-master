import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import google from '../assets/google.svg';
import microsoft from '../assets/microsoft.svg';
import apple from '../assets/apple-logo.svg';

const Login = () => {
    return (
        <>
            <section className="w-screen h-screen py-16 px-8 overflow-x-hidden">
                <img src={logo} alt="" className="m-auto w-16" />

                <div className="md:w-2/4 m-auto">
                    <div className="flex flex-col justify-center items-center w-full gap-4 mt-16">
                        <h1 className="font-medium text-3xl text-center">
                            Welcome Back
                        </h1>
                        <input
                            type="email"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder='Email address'
                        />
                        <button className="bg-yedu-green h-10 py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80">
                            Continue
                        </button>
                        <p className="my-2">
                            Already have an account?{' '}
                            <Link
                                to="/users/signup"
                                className="text-yedu-green hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                        <span className="w-full relative flex items-center">
                            <hr className="text-yedu-dark-gray w-1/3" />
                            <p className=" bg-yedu-white w-1/3 text-center">
                                OR
                            </p>
                            <hr className="text-yedu-dark-gray w-1/3" />
                        </span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-full gap-6 m-auto my-8">
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={google} alt="" /> Continue with Google
                        </button>
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={microsoft} alt="" />
                            Continue with Microsoft
                        </button>
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={apple} alt="" /> Continue with Apple
                        </button>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Login;