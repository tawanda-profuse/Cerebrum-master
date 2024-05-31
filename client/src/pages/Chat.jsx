import logo from '../assets/logo.svg';
import plane from '../assets/plane-fly.svg';
import lightbulb from '../assets/lightbulb.svg';
import pen from '../assets/penline.svg';
import cap from '../assets/cap-outline.svg';
import paperclip from '../assets/paper-clip.svg';
import sendbutton from '../assets/send-button.svg';
import Navigation from '../components/Navigation';

const Chat = () => {
    const messages = [
        {
            content: 'Lorem ipsum dolor',
            role: 'user',
            timestamp: new Date(),
        },
        {
            content:
                'Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, quibusdam!',
            role: 'assistant',
            timestamp: new Date(),
        },
        {
            content: 'Lorem ipsum dolor',
            role: 'user',
            timestamp: new Date(),
        },
        {
            content:
                'Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, quibusdam!',
            role: 'assistant',
            timestamp: new Date(),
        },
        {
            content: 'Lorem ipsum dolor SYSTEM',
            role: 'system',
            timestamp: new Date(),
        },
        {
            content:
                'Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, quibusdam! Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ea rem unde reiciendis adipisci quas.',
            role: 'assistant',
            timestamp: new Date(),
        },
    ];
    // const messages = [];

    return (
        <section className="p-4 font-montserrat max-h-screen">
            <Navigation />
            <button className="absolute top-2 right-24 py-1 px-2 rounded-full">
                <i className="fas fa-upload text-yedu-gray-text text-2xl"></i>
            </button>
            <img
                src={logo}
                alt=""
                className={`w-12 m-auto mt-20 ${messages.length > 0 ? 'hidden' : 'block'}`}
            />
            <div
                className={`flex flex-col relative min-h-96 ${messages.length > 0 ? 'mt-24' : ''}`}
            >
                <div
                    className={`flex items-center m-auto w-3/5 ${messages.length > 0 ? 'flex-col -mb-10 max-h-80 overflow-y-scroll gap-8 p-4' : 'flex-row flex-wrap justify-center gap-4'}`}
                >
                    <button
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                    >
                        <img
                            src={plane}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                            Plan a relaxing day
                        </p>
                    </button>
                    <button
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                    >
                        <img
                            src={lightbulb}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                            Morning routine for productivy
                        </p>
                    </button>
                    <button
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                    >
                        <img
                            src={pen}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                            Content calendar for TikTok
                        </p>
                    </button>
                    <button
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                    >
                        <img
                            src={cap}
                            alt=""
                            className="absolute top-2 left-2"
                        />
                        <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                            Explain nostalgia to a kindergartener
                        </p>
                    </button>
                    {messages &&
                        messages
                            .filter((item) => item.role !== 'system')
                            .map((message, index) => (
                                <div
                                    className={`${message.role === 'user' ? 'self-start' : 'self-end'} max-w-4/5 shadow-sm shadow-yedu-dark-gray p-2 rounded-md flex flex-col gap-3`}
                                    key={index}
                                >
                                    <div className="flex gap-4">
                                        {message.role === 'assistant' && (
                                            <img
                                                src={logo}
                                                alt=""
                                                className="w-8"
                                            />
                                        )}
                                        {message.content}
                                    </div>
                                    <span className="self-end font-medium">
                                        {message.timestamp.toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }
                                        )}
                                    </span>
                                </div>
                            ))}
                </div>
                <div className="flex flex-col gap-10 relative bottom-0 left-2/4 -translate-x-2/4 w-3/5 py-4">
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
