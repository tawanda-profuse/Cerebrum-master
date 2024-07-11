const DomainCard = ({ domain, isExact = false, onSelect }) => {
    return (
        <div className="bg-white border rounded-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
                <div className="flex flex-wrap gap-2 mb-2">
                    {domain.isPremium && (
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">PREMIUM</span>
                    )}
                    {['store', 'online', 'site'].includes(domain.tld) && (
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">FEATURED</span>
                    )}
                </div>
                <span className="text-xl font-bold">{domain.domain}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 sm:mt-0 w-full sm:w-auto">
                {domain.available ? (
                    <>
                        <div className="flex items-center mb-2 sm:mb-0">
                            <span className="text-2xl font-bold text-green-600">${domain.price}</span>
                            {domain.promoPrice && domain.promoPrice !== domain.price && (
                                <span className="line-through ml-2">${domain.promoPrice}</span>
                            )}
                        </div>
                        <button
                            onClick={() => onSelect(domain)}
                            className="mt-2 sm:mt-0 sm:ml-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300 ease-in-out w-full sm:w-auto"
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

export default DomainCard;