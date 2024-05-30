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
        <section className='p-4'>
            <Navigation/>
            <img src={logo} alt="" className="w-12 m-auto mt-20"/>
            <div className="flex gap-2 mt-16 m-auto w-3/4">
                <button className='w-1/4 border rounded-lg py-2 px-4 relative hover:bg-yedu-dull'>
                    <img src={plane} alt="" className='absolute top-2 left-2' />
                    <p className="text-yedu-gray-text">Plan a relaxing day</p>
                </button>
                <button className='w-1/4 border rounded-lg py-2 px-4 relative hover:bg-yedu-dull'>
                    <img src={lightbulb} alt="" className='top-2 left-2' />
                    <p className="text-yedu-gray-text">Morning routine for productivy</p>
                </button>
                <button className='w-1/4 border rounded-lg py-2 px-4 relative hover:bg-yedu-dull'>
                    <img src={pen} alt="" className='top-2 left-2' />
                    <p className="text-yedu-gray-text">Content calendar for TikTok</p>
                </button>
                <button className='w-1/4 border rounded-lg py-2 px-4 relative hover:bg-yedu-dull'>
                    <img src={cap} alt="" className='top-2 left-2' />
                    <p className="text-yedu-gray-text">Explain nostalgia to a kindergartener</p>
                </button>
            </div>
            <div className='w-3/4 m-auto mt-32 relative'>
                <button className='absolute top-1/4 left-2'>
                    <img src={paperclip} alt="" />
                </button>
                <input type='text' className='border w-full border-yedu-green rounded-3xl py-2 px-10' placeholder='Message Yedu'/>
                <button className='absolute right-2'>
                    <img src={sendbutton} alt="" />
                </button>
            </div>
            <p className='text-center mt-4'>
                YeduAI can make mistakes. Make sure to check important
                information.
            </p>
        </section>
    );
};

export default Chat;
