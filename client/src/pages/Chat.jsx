import logo from '../assets/logo.svg';
import plane from '../assets/plane-fly.svg';
import lightbulb from '../assets/lightbulb.svg';
import pen from '../assets/penline.svg';
import cap from '../assets/cap-outline.svg';
import paperclip from '../assets/paper-clip.svg';
import sendbutton from '../assets/send-button.svg';
import Navigation from '../components/Navigation';

const Chat = () => {
    return (
        <section className="p-4 font-montserrat max-h-screen">
            <Navigation />
            <img src={logo} alt="" className="w-12 m-auto mt-20" />
            <div className="flex flex-col">
                <div className="flex flex-wrap justify-center gap-5 mt-16 m-auto w-3/4 overflow-y-auto">
                    <button className="w-40 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull">
                        <img
                            src={plane}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8">
                            Plan a relaxing day
                        </p>
                    </button>
                    <button className="w-40 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull">
                        <img
                            src={lightbulb}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8">
                            Morning routine for productivy
                        </p>
                    </button>
                    <button className="w-40 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull">
                        <img
                            src={pen}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8">
                            Content calendar for TikTok
                        </p>
                    </button>
                    <button className="w-40 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull">
                        <img
                            src={cap}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8">
                            Explain nostalgia to a kindergartener
                        </p>
                    </button>
                </div>
                <div className="flex flex-col gap-10 fixed bottom-0 left-2/4 -translate-x-2/4 w-3/5 py-4">
                    <div className="w-full m-auto relative py-8">
                        <button className="absolute my-4 left-4 z-10">
                            <img src={paperclip} alt="" />
                        </button>
                        <input
                            type="text"
                            className="border w-full absolute left-2/4 -translate-x-2/4 h-14 border-yedu-green rounded-3xl px-12 outline-none text-sm"
                            placeholder="Message Yedu"
                        />
                        <button className="absolute right-4 z-10 my-2 hover:opacity-80">
                            <img src={sendbutton} alt="" />
                        </button>
                    </div>
                    <p className="text-center text-sm">
                        YeduAI can make mistakes. Make sure to check important
                        information.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Chat;
