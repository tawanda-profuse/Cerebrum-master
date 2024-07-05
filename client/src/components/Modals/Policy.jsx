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
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles extended-modal-styles"
                ref={modalRef}
                open={display}
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
                <p className="text-left text-yedu-gray-text my-4">
                    Welcome to Yedu AI. Your privacy is of utmost importance to
                    us. This Privacy Policy outlines the types of personal
                    information we collect, how we use and protect this
                    information, and your rights regarding your data. By using
                    our website and services, you agree to the collection and
                    use of information in accordance with this policy.
                </p>

                {/* Information We Collect */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Information We Collect
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    We collect various types of information to provide and
                    improve our service to you. This includes personal data such
                    as your name, email address, and usage data, which refers to
                    how you interact with our website. We may also collect
                    technical data, including your IP address, browser type, and
                    operating system. This information helps us understand how
                    our website is used and how we can enhance your experience.
                </p>

                {/* Use of Your Information */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Use of Your Information
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    Yedu AI uses the collected data for several purposes: to
                    provide and maintain our service, to notify you about
                    changes to our service, to allow you to participate in
                    interactive features, and to provide customer support. We
                    also use this information to monitor the usage of our
                    service and to detect, prevent, and address technical
                    issues. Your data is not shared with any third parties
                    without your explicit consent, except as required by law.
                </p>

                {/* Data Security */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Data Security
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    We take your data security seriously. Yedu AI employs a
                    variety of security measures to ensure the protection of
                    your personal information. This includes using encryption
                    technologies to safeguard your data and regularly reviewing
                    our security practices to enhance our protections. Despite
                    these measures, please be aware that no method of
                    transmission over the Internet or method of electronic
                    storage is completely secure.
                </p>

                {/* Your Rights and Choices */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Your Rights and Choices
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    You have the right to access, correct, or delete your
                    personal information at any time. If you wish to exercise
                    these rights or have any questions regarding our privacy
                    practices, please email us <a href="mailto:admin@yeduai.io" className="underline hover:no-underline">here</a>.
                </p>

                {/* Return Policy */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Return Policy
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    You have the right to cancel your contract with Yedu AI
                    without giving a reason within 14 days, in accordance with
                    the Consumer Rights Act of May 30, 2014, Art. 27. If you
                    wish to exercise this right, please contact us at the email
                    address provided above.
                </p>

                {/* Complaint Policy */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Complaint Policy
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    If you have any complaints about our services, please
                    contact us at <a href="mailto:admin@yeduai.io" className="underline hover:no-underline">admin@yeduai.io</a>. We will
                    address your complaint within 14 days.
                </p>

                {/* Privacy Policy */}
                <h2 className="text-xl text-left font-bold underline my-6">
                    Privacy Policy
                </h2>
                <p className="text-left text-yedu-gray-text my-4">
                    Yedu AI is the Data Controller for the personal information
                    collected through our website and services. We are committed
                    to protecting your privacy and will only use your data in
                    accordance with this policy.
                </p>
            </dialog>
        </>
    );
};

export default Policy;