import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

const ProductionModal = ({ display, setDisplay }) => {
    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState('');
    const [searchResults, setSearchResults] = useState({});
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [hostingPlan, setHostingPlan] = useState('hobby');
    const [storage, setStorage] = useState(5);
    const [paymentIntegration, setPaymentIntegration] = useState(false);
    const [summary, setSummary] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

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

    const handleSubmit = async (event) => {
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
          };
          console.log("Sending order data:", orderData);
          const response = await axios.post(
            `${baseURL}/payments/user/hosting`,
            orderData,
            { headers: { Authorization: `Bearer ${jwt}` } },
          );
          console.log("Server response:", response.data);
          if (
            response.status === 200 &&
            response.data.success &&
            response.data.redirect
          ) {
            setPaymentUrl(response.data.redirect);
            openPaymentWindow(response.data.redirect);
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
      };
      

    const getFeaturedDomains = (suggestions) => {
        const featuredTLDs = ['store', 'online', 'site'];
        return suggestions.filter(domain => featuredTLDs.includes(domain.tld));
    };

    if (!display) return null;

    const openPaymentWindow = (url) => {
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(url, 'PaymentWindow', `width=${width},height=${height},left=${left},top=${top}`);
    };

    return (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
  <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
    <div class="p-6 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Move to Production</h2>
        <button onClick={() => setDisplay(false)} class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="mb-6">
        <div class="flex justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              class={`w-1/3 h-1 ${s <= step ? 'bg-green-500' : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
        <div class="flex justify-between text-xs text-gray-500">
          <span>Domain</span>
          <span>Configuration</span>
          <span>Summary</span>
        </div>
      </div>

      <div class="mb-6">
        {step === 1 && (
          <div>
            <h3 class="text-lg font-semibold mb-4">Search for a Domain</h3>
            <div class="flex mb-4 relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter a domain name"
                class="p-2 text-lg border-2 border-green-500 rounded-lg flex-grow focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSearch}
                class="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition duration-300 absolute right-2 top-1/2 transform -translate-y-1/2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <i class="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i class="fas fa-search mr-2 "></i>Search
                  </>
                )}
              </button>
            </div>
            <div class="max-h-60 overflow-y-auto custom-scrollbar">
              {searchResults.error && (
                <p class="text-red-500">{searchResults.error}</p>
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
                  <h4 class="font-semibold mt-4 mb-2">Featured Domains</h4>
                  {getFeaturedDomains(searchResults.suggestions).map((domain, index) => (
                    <DomainCard
                      key={index}
                      domain={domain}
                      onSelect={selectDomain}
                    />
                  ))}
                  <h4 class="font-semibold mt-4 mb-2">Other Suggestions</h4>
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
          <div class="space-y-6">
            <h3 class="text-lg font-semibold mb-4">Configure Your Hosting</h3>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Choose Hosting Plan</label>
              <div class="relative">
                <select
                  value={hostingPlan}
                  onChange={(e) => setHostingPlan(e.target.value)}
                  class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-green-50 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md appearance-none cursor-pointer transition duration-150 ease-in-out hover:bg-green-100"
                >
                  <option value="hobby">Hobby ($5/month)</option>
                  <option value="business">Business ($25/month)</option>
                  <option value="enterprise">Enterprise ($100/month)</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Storage (GB): {storage}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={paymentIntegration}
                  onChange={(e) => setPaymentIntegration(e.target.checked)}
                  class="form-checkbox h-5 w-5 text-green-600"
                />
                <span class="ml-2 text-gray-700">Include Payment Integration ($2/month + fees)</span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-200">
                  <th class="py-2 px-4 border-b">Item</th>
                  <th class="py-2 px-4 border-b">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-2 px-4 border-b">Domain: {selectedDomain?.domain}</td>
                  <td class="py-2 px-4 border-b">${summary.domainCost?.toFixed(2)}/year</td>
                </tr>
                <tr>
                  <td class="py-2 px-4 border-b">Hosting: {hostingPlan}</td>
                  <td class="py-2 px-4 border-b">${summary.hostingCost?.toFixed(2)}/month</td>
                </tr>
                <tr>
                  <td class="py-2 px-4 border-b">Storage: {storage}GB</td>
                  <td class="py-2 px-4 border-b">${summary.storageCost?.toFixed(2)}/month</td>
                </tr>
                {paymentIntegration && (
                  <tr>
                    <td class="py-2 px-4 border-b">Payment Integration</td>
                    <td class="py-2 px-4 border-b">${summary.paymentIntegrationCost?.toFixed(2)}/month + fees</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div class="mt-4">
              <div class="text-right">
                <span class="font-semibold">Subtotal: ${summary.subtotal?.toFixed(2)}</span>
              </div>
              <div class="text-right">
                <span class="font-semibold">VAT (23%): ${summary.vat?.toFixed(2)}</span>
              </div>
              <div class="text-right text-xl font-bold mt-2">
                <span>Total: ${summary.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div class="mt-6 flex justify-between">
        {step > 1 && (
          <button
            onClick={handlePrevious}
            class="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <i class="fas fa-arrow-left mr-2"></i>
            Previous
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={handleNext}
            class="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-auto"
          >
            Next
            <i class="fas fa-arrow-right ml-2"></i>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            class="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-auto"
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

const DomainCard = ({ domain, isExact = false, onSelect }) => {
    return (
        <div className="bg-white border rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
                {domain.isPremium && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold mb-2 inline-block">PREMIUM</span>
                )}
                {['store', 'online', 'site'].includes(domain.tld) && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold mb-2 inline-block">FEATURED</span>
                )}
                <span className="text-xl font-bold">{domain.domain}</span>
            </div>
            <div className="flex items-center">
                {domain.available ? (
                    <>
                        <span className="text-2xl font-bold text-green-600">${domain.price}</span>
                        {domain.promoPrice && domain.promoPrice !== domain.price && (
                            <span className="line-through ml-2">${domain.promoPrice}</span>
                        )}
                        <button
                            onClick={() => onSelect(domain)}
                            className="ml-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300 ease-in-out"
                        >
                            Select
                        </button>
                    </>
                ) : (
                    <span className="text-red-500">Not available</span>
                )}
            </div>
        </div>
    );
};

export default ProductionModal;
