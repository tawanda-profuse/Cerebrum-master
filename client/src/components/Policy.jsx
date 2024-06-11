import { useRef, useEffect } from 'react';

const Policy = ({ display, setDisplay }) => {
    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setDisplay(false);
            }
        };

        if (display) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [display, setDisplay]);
    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-50 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg modal-content ${display ? 'block' : 'hidden'}`}
            ref={modalRef}
        >
            <button className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125">
                <i
                    className="fas fa-times"
                    onClick={() => {
                        setDisplay(false);
                    }}
                ></i>
            </button>
            <h1 className="text-3xl text-center font-bold underline my-12">
                Privacy Policy
            </h1>
            <h2 className="text-xl text-left font-bold underline my-6">
                Introduction
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Welcome to Yedu AI. Your privacy is of utmost importance to us.
                This Privacy Policy outlines the types of personal information
                we collect, how we use and protect this information, and your
                rights regarding your data. By using our website and services,
                you agree to the collection and use of information in accordance
                with this policy.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Information We Collect
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                We collect various types of information to provide and improve
                our service to you. This includes personal data such as your
                name, email address, and usage data, which refers to how you
                interact with our website. We may also collect technical data,
                including your IP address, browser type, and operating system.
                This information helps us understand how our website is used and
                how we can enhance your experience.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Use of Your Information
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Yedu AI uses the collected data for several purposes: to provide
                and maintain our service, to notify you about changes to our
                service, to allow you to participate in interactive features,
                and to provide customer support. We also use this information to
                monitor the usage of our service and to detect, prevent, and
                address technical issues. Your data is not shared with any third
                parties without your explicit consent, except as required by
                law.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Data Security
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                We take your data security seriously. Yedu AI employs a variety
                of security measures to ensure the protection of your personal
                information. This includes using encryption technologies to
                safeguard your data and regularly reviewing our security
                practices to enhance our protections. Despite these measures,
                please be aware that no method of transmission over the Internet
                or method of electronic storage is completely secure.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Your Rights and Choices
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                You have the right to access, correct, or delete your personal
                information at any time. If you wish to exercise these rights or
                have any questions regarding our privacy practices, please email
                us{' '}
                <a
                    href="mailto:admin@yeduai.io"
                    className="underline hover:no-underline"
                >
                    here
                </a>
                .
            </p>
        </dialog>
    );
};

export default Policy;
