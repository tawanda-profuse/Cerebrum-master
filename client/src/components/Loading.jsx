import logo from '../assets/logo.svg';

const Loading = () => {
    return (
        <div className="absolute w-full h-screen z-50 flex flex-col gap-12 items-center justify-center bg-yedu-white">
            <img src={logo} alt="" className="w-[10%]" />
            <i className="fas fa-spinner animate-spin text-3xl"></i>
        </div>
    );
};

export default Loading;
