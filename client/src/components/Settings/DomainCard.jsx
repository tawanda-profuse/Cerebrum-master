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

export default DomainCard;