import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import tokenIcon from '../assets/generating-tokens.svg';
import useState from "react";

const Navigation = () => {
    const [userAccount, setUserAccount] = useState(false);
    return (
        <>
            <div className="flex gap-4 absolute top-2 left-2">
                <button>
                    <img src={leftpanel} alt="" />
                </button>
                <button>
                    <img src={newtab} alt="" />
                </button>
                <span className="text-sm text-yedu-dark flex items-center gap-1">
                    Remaining <img src={tokenIcon} alt="" /> 250
                </span>
            </div>
            <button className="absolute top-2 right-4 bg-yedu-dark border-2 border-yedu-green w-10 h-10 rounded-full" onClick={() => setUserAccount(true)}></button>
            <div className={`absolute top-12 right-4 w-40 ${userAccount ? "hidden" : "block"}`}>
                <p><i className="fas fa-gear"></i> Settings</p>
                <hr/>
                <p><i className="fas fa-right-from-bracket"></i> Log Out</p>
            </div>
        </>
    );
};

export default Navigation;
