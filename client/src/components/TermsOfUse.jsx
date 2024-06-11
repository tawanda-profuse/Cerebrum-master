import { useRef, useEffect } from 'react';

const TermsOfUse = ({ show, setShow }) => {
    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShow(false);
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, setShow]);

    if (!show) {
        return null;
    }
    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-50 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg modal-content ${show ? 'block' : 'hidden'}`}
            ref={modalRef}
        >
            <button className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125">
                <i
                    className="fas fa-times"
                    onClick={() => {
                        setShow(false);
                    }}
                ></i>
            </button>
            <h1 className="text-3xl text-center font-bold underline my-12">
                Terms of Use
            </h1>
            <h2 className="text-xl text-left font-bold underline my-6">
                Introduction
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Welcome to Yedu AI. By accessing or using our website and
                services, you agree to comply with and be bound by the following
                Terms of Service ("Terms"). Please read these Terms carefully
                before using our service. If you do not agree with any part of
                these Terms, you must not use our website or services.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Eligibility
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                By using Yedu AI, you represent and warrant that you are at
                least 18 years old or have the legal capacity to enter into
                these Terms. If you are using our services on behalf of a
                company or other legal entity, you represent that you have the
                authority to bind that entity to these Terms.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Use of Service
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Yedu AI grants you a limited, non-exclusive, non-transferable,
                and revocable license to use our services for personal or
                internal business purposes, in accordance with these Terms. You
                agree not to use the service for any unlawful or prohibited
                activities, including but not limited to:
            </p>
            <ol>
                <li className="text-yedu-gray-text my-4">
                    <strong>Violating Laws</strong>: Engaging in any activity
                    that violates any applicable law or regulation.
                </li>
                <li className="text-yedu-gray-text my-4">
                    <strong>Infringing Rights</strong>: Infringing upon the
                    intellectual property or privacy rights of others.
                </li>
                <li className="text-yedu-gray-text my-4">
                    <strong>Harmful Conduct</strong>: Transmitting harmful or
                    malicious software, or attempting to disrupt or damage our
                    systems or services.
                </li>
                <li className="text-yedu-gray-text my-4">
                    <strong>Unauthorized Access</strong>: Attempting to gain
                    unauthorized access to our systems or networks.
                </li>
            </ol>
            <h2 className="text-xl text-left font-bold underline my-6">
                Intellectual Property
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                All content and materials available on Yedu AI, including but
                not limited to text, graphics, logos, and software, are the
                property of Yedu AI or its licensors and are protected by
                applicable intellectual property laws. You may not reproduce,
                distribute, or create derivative works from any content without
                our explicit written permission.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                User Content
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                You may have the opportunity to submit or upload content to Yedu
                AI. By submitting content, you grant Yedu AI a worldwide,
                non-exclusive, royalty-free, transferable license to use,
                reproduce, distribute, and display your content in connection
                with our services. You represent and warrant that you have the
                right to grant this license and that your content does not
                violate any third-party rights or applicable laws.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Termination
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Yedu AI reserves the right to suspend or terminate your access
                to our services at any time, without prior notice or liability,
                for any reason, including if you breach these Terms. Upon
                termination, your right to use the services will immediately
                cease, and any data or content you have submitted may no longer
                be accessible.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Disclaimer of Warranties
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Yedu AI provides its services "as is" and "as available,"
                without any warranties of any kind, either express or implied,
                including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement. We do not warrant that our services will be
                uninterrupted, error-free, or secure.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Limitation of Liability
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                To the maximum extent permitted by law, Yedu AI shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses, resulting from (a) your
                use or inability to use the service; (b) any unauthorized access
                to or use of our servers and/or any personal information stored
                therein; (c) any interruption or cessation of transmission to or
                from the service.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Governing Law
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                These Terms shall be governed and construed in accordance with
                the laws of Poland, without regard to its conflict of law
                principles. You agree to submit to the personal jurisdiction of
                the courts located in Poland for the purpose of litigating all
                such claims or disputes.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Changes to Terms
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                Yedu AI reserves the right to modify or replace these Terms at
                any time. We will provide notice of any changes by posting the
                new Terms on our website. Your continued use of the services
                after any such changes constitutes your acceptance of the new
                Terms.
            </p>
            <h2 className="text-xl text-left font-bold underline my-6">
                Contact Us
            </h2>
            <p className="text-left text-yedu-gray-text my-4">
                If you have any questions about these Terms, please contact us
                using{' '}
                <a
                    href="mailto:admin@yeduai.io"
                    className="underline hover:no-underline"
                >
                    our email address
                </a>
                .
            </p>
        </dialog>
    );
};

export default TermsOfUse;
