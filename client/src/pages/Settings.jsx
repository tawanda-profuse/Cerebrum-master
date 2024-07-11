import React, { useEffect, useRef, useState } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDeleteProject from '../components/Modals/ConfirmDeleteProject';
import ProfileSection from '../components/Settings/ProfileSection';
import ShowProjects from '../components/Settings/ShowProjects';
import Pricing from '../components/Settings/Pricing';
import axios from 'axios';
import DomainCard from '../components/Settings/DomainCard';
import CheckoutForm from '../components/Settings/CheckoutForm';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;

const DomainSearchModal = ({ setDisplay }) => {
    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState('');
    const [searchResults, setSearchResults] = useState({});
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [hostingPlan, setHostingPlan] = useState('hobby');
    const [storage, setStorage] = useState(5);
    const [paymentIntegration, setPaymentIntegration] = useState(false);
    const [summary, setSummary] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${baseURL}/api/search?domain=${domain}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error:', error);
            setSearchResults({ error: 'An error occurred while searching for domains.' });
        }
        setIsLoading(false);
    };

    const selectDomain = (domain) => {
        setSelectedDomain(domain);
        setStep(2);
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handlePrevious = () => {
        if (step > 1) setStep(step - 1);
    };

    const calculateCosts = () => {
        const domainCost = selectedDomain ? parseFloat(selectedDomain.price) : 0;
        const hostingCost = hostingPlan === 'hobby' ? 5 : hostingPlan === 'business' ? 25 : 100;
        const storageCost = (storage - 5) * 0.4;
        const paymentIntegrationCost = paymentIntegration ? 2 : 0;

        const subtotal = domainCost + hostingCost + storageCost + paymentIntegrationCost;
        const vat = subtotal * 0.23;
        const total = subtotal + vat;

        setSummary({
            domainCost,
            hostingCost,
            storageCost,
            paymentIntegrationCost,
            subtotal,
            vat,
            total
        });
    };

    useEffect(() => {
        if (step === 3) {
            calculateCosts();
        }
    }, [step]);

    const clearState = () => {
        setStep(1);
        setDomain('');
        setSearchResults({});
        setSelectedDomain(null);
        setHostingPlan('hobby');
        setStorage(5);
        setPaymentIntegration(false);
        setSummary({});
        setIsLoading(false);
    };

    const handleSubmit = async (event) => {
        const currentProject = localStorage.getItem('selectedProjectId');
        event.preventDefault();
        const jwt = localStorage.getItem("jwt");
        try {
            const orderData = {
                domain: selectedDomain.domain,
                hostingPlan,
                storage,
                paymentIntegration,
                domainCost: summary.domainCost,
                hostingCost: summary.hostingCost,
                paymentIntegrationCost: summary.paymentIntegrationCost,
                storageCost: summary.storageCost,
                subtotal: summary.subtotal,
                vat: summary.vat,
                total: summary.total,
                projectId: currentProject
            };
            const response = await axios.post(
                `${baseURL}/payments/user/hosting`,
                orderData,
                { headers: { Authorization: `Bearer ${jwt}` } },
            );
            if (
                response.status === 200 &&
                response.data.success &&
                response.data.redirect
            ) {
                // Redirect to the checkout page
                window.location.href = response.data.redirect;
            } else {
                toast.error(
                    "Order creation failed: " + (response.data.message || "Unknown error"),
                    {
                        autoClose: 5000,
                    },
                );
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(
                "Order creation failed: " +
                (error.response?.data?.message || error.message),
                {
                    autoClose: 5000,
                },
            );
        }
        clearState();
        setDisplay(false);
    };

    const getFeaturedDomains = (suggestions) => {
        const featuredTLDs = ['store', 'online', 'site'];
        return suggestions.filter(domain => featuredTLDs.includes(domain.tld));
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark-applied rounded-lg w-full max-w-3xl my-8">
            <div className="p-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setDisplay(false)} className="text-gray-500 dark:text-white hover:text-gray-700">
                  <i className="fas fa-times"></i>
                </button>
              </div>
      
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-1/3 h-2 ${s <= step ? 'bg-green-500' : 'bg-gray-200'}`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark  dark:text-gray-300">
                  <span>Domain</span>
                  <span>Configuration</span>
                  <span>Summary</span>
                </div>
              </div>
      
              <div className="mb-8">
                {step === 1 && (
                  <div>
                    <h3 className="text-2xl font-semibold mb-6">Search for a Domain</h3>
                    <div className="flex mb-6 relative">
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter domain name"
                        className="p-3 text-lg border-2 border-green-500 rounded-lg flex-grow focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={handleSearch}
                        className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-300 absolute right-0 md:right-2 top-1/2 transform -translate-y-1/2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fas fa-search mr-2"></i>Search
                          </>
                        )}
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {searchResults.error && (
                        <p className="text-red-500">{searchResults.error}</p>
                      )}
                      {searchResults.exactDomain && (
                        <DomainCard
                          domain={searchResults.exactDomain}
                          isExact={true}
                          onSelect={selectDomain}
                        />
                      )}
                      {searchResults.suggestions && (
                        <>
                          <h4 className="font-semibold mt-6 mb-3">Featured Domains</h4>
                          {getFeaturedDomains(searchResults.suggestions).map((domain, index) => (
                            <DomainCard
                              key={index}
                              domain={domain}
                              onSelect={selectDomain}
                            />
                          ))}
                          <h4 className="font-semibold mt-6 mb-3">Other Suggestions</h4>
                          {searchResults.suggestions
                            .filter((domain) => !getFeaturedDomains(searchResults.suggestions).includes(domain))
                            .map((domain, index) => (
                              <DomainCard
                                key={index}
                                domain={domain}
                                onSelect={selectDomain}
                              />
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
      
                {step === 2 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-semibold mb-6">Configure Your Hosting</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2">Choose Hosting Plan</label>
                      <div className="relative">
                        <select
                          value={hostingPlan}
                          onChange={(e) => setHostingPlan(e.target.value)}
                          className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 bg-green-50 dark:bg-green-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md appearance-none cursor-pointer transition duration-150 ease-in-out hover:bg-green-100"
                        >
                          <option value="hobby">Hobby ($5/month)</option>
                          <option value="business">Business ($25/month)</option>
                          <option value="enterprise">Enterprise ($100/month)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2">
                        Select Storage (GB): {storage}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={storage}
                        onChange={(e) => setStorage(e.target.value)}
                        className="w-full h-2 bg-green-200 dark:bg-green-400 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentIntegration}
                          onChange={(e) => setPaymentIntegration(e.target.checked)}
                          className="form-checkbox h-5 w-5 accent-green-600 dark:accent-yedu-light-green cursor-pointer"
                        />
                        <span className="ml-2 text-gray-700 dark:text-[#ccc]">Include Payment Integration ($2/month + fees)</span>
                      </label>
                    </div>
                  </div>
                )}
      
                {step === 3 && (
                  <div>
                    <h3 className="text-2xl font-semibold mb-6">Order Summary</h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-[#666]">
                          <th className="py-3 px-4 border-b">Item</th>
                          <th className="py-3 px-4 border-b">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-3 px-4 border-b">Domain: {selectedDomain?.domain}</td>
                          <td className="py-3 px-4 border-b">${summary.domainCost?.toFixed(2)}/year</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border-b">Hosting: {hostingPlan}</td>
                          <td className="py-3 px-4 border-b">${summary.hostingCost?.toFixed(2)}/month</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border-b">Storage: {storage}GB</td>
                          <td className="py-3 px-4 border-b">${summary.storageCost?.toFixed(2)}/month</td>
                        </tr>
                        {paymentIntegration && (
                          <tr>
                            <td className="py-3 px-4 border-b">Payment Integration</td>
                            <td className="py-3 px-4 border-b">${summary.paymentIntegrationCost?.toFixed(2)}/month + fees</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="mt-6">
                      <div className="text-right">
                        <span className="font-semibold">Subtotal: ${summary.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">VAT (23%): ${summary.vat?.toFixed(2)}</span>
                      </div>
                      <div className="text-right text-xl font-bold mt-4">
                        <span>Total: ${summary.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
      
              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Previous
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-auto"
                  >
                    Next
                    <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-auto"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
};

const Settings = () => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentProject = localStorage.getItem('selectedProjectId');
    const isNavigationCollapsed =
        localStorage.getItem('isNavigationCollapsed') === 'true';
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [profileSection, setProfileSection] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);
    const [openPricing, setOpenPricing] = useState(true);
    const [openConfirmDelete, setConfirmDelete] = useState(false);
    const [showDomainSearchModal, setShowDomainSearchModal] = useState(false);
    const [showCheckoutModal,setShowCheckoutModal] = useState(false);
    const deleteProjectRef = useRef(null);

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now().valueOf() / 1000;
        return now > exp;
    }

    useEffect(() => {
        document.title = 'Yedu User Settings';

        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        if (!isLoggedIn()) {
            localStorage.clear();
            navigate('/');
        }
    }, [jwt, navigate]);

    const handleHomeNavigation = () => {
        if (currentProject) {
            navigate(`/chat/${currentProject}`);
        } else {
            navigate('/chat');
        }
    };

    const handleLogOut = () => {
        if (jwt) {
            localStorage.clear();
            navigate('/');
            toast.success('Successfully logged out.', {
                autoClose: 4000,
            });
        }
    };

    return (
        <>
            <ConfirmDeleteProject
                display={openConfirmDelete}
                setDisplay={setConfirmDelete}
                deleteProjectRef={deleteProjectRef}
            />
            <Navigation
                sideMenu={isNavigationCollapsed}
                setSideMenu={setSideMenu}
                currentProject={currentProject}
                confirmDeleteDisplay={openConfirmDelete}
                setConfirmDeleteDisplay={setConfirmDelete}
                deleteProjectRef={deleteProjectRef}
            />
            {showDomainSearchModal && <DomainSearchModal setDisplay={setShowDomainSearchModal} />}
            {showCheckoutModal && <CheckoutForm
                display={showCheckoutModal}
                setDisplay={setShowCheckoutModal}
            />}
            <section className="bg-yedu-dull min-h-screen flex gap-4 justify-center dark-applied-body">
                <main
                    className={`min-w-[90vw] md:min-w-[70vw] bg-yedu-white rounded-lg py-6 mt-[6rem] px-4 form-entry h-[80vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent transition-all dark-applied ${sideMenu ? 'md:translate-x-[12%]' : 'md:translate-x-0'}`}
                >
                    <div className="flex w-full justify-between items-center mb-4">
                        <h1 className="font-semibold text-2xl">Settings</h1>
                        <button
                            className="rounded-full bg-green-100 dark:bg-green-500 py-2 px-3 transition-all hover:scale-125"
                            title="Back to home"
                            onClick={handleHomeNavigation}
                        >
                            <i className="fas fa-home"></i>
                        </button>
                    </div>
                    <div className="m-auto flex gap-10 flex-col md:flex-row items-start px-4">
                        <div className="flex-auto md:flex-[0.4] md:flex-col md:my-0 my-4 flex justify-between md:justify-center gap-4 m-auto w-full">
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${openPricing ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setOpenPricing(true);
                                    setProfileSection(false);
                                    setOpenProjects(false);
                                }}
                            >
                                <i className="fas fa-credit-card text-lg"></i>
                                <span className="hidden md:block">Plans</span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${openProjects ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setOpenProjects(true);
                                    setProfileSection(false);
                                    setOpenPricing(false);
                                }}
                            >
                                <i className="fas fa-list text-lg"></i>
                                <span className="hidden md:block">
                                    Projects
                                </span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${profileSection ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setProfileSection(true);
                                    setOpenProjects(false);
                                    setOpenPricing(false);
                                }}
                            >
                                <i className="fas fa-gear text-lg"></i>
                                <span className="hidden md:block">General</span>
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm dark:hover:bg-yedu-dark-gray dark:hover:text-yedu-dark hover:bg-green-100"
                                onClick={handleLogOut}
                            >
                                <i className="fas fa-right-from-bracket text-lg"></i>
                                <span className="hidden md:block">Logout</span>
                            </button>
                        </div>
                        <div className="flex-auto w-full md:flex-1 m-auto flex flex-wrap items-center">
                            <ProfileSection display={profileSection} />
                            <ShowProjects
                                display={openProjects}
                                setOpenProduction={setShowDomainSearchModal}
                            />
                            <Pricing
                                display={openPricing}
                                setOpenProjects={setOpenProjects}
                                setOpenPricing={setOpenPricing}
                                setOpenCheckout={setShowCheckoutModal}
                            />
                        </div>
                    </div>
                </main>
            </section>
        </>
    );
};

export default Settings;