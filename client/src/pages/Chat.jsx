import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
  } from "react";
  import { toast } from "react-toastify";
  import { useNavigate } from "react-router-dom";
  import { useStoreState } from "easy-peasy";
  import { getSocket } from "../socket";
  import ChatMessage from "../components/ChatMessage";
  import logo from "../assets/logo.svg";
  import plane from "../assets/plane-fly.svg";
  import lightbulb from "../assets/lightbulb.svg";
  import pen from "../assets/penline.svg";
  import cap from "../assets/cap-outline.svg";
  import { useMediaQuery } from 'react-responsive';
  
  const Navigation = React.lazy(() => import("../components/Navigation"));
  const CreateProject = React.lazy(
    () => import("../components/Modals/CreateProject"),
  );
  const FileUpload = React.lazy(
    () => import("../components/Modals/FileManagement/FileUpload"),
  );
  const ConfirmDeleteProject = React.lazy(
    () => import("../components/Modals/ConfirmDeleteProject"),
  );
  
  const Chat = React.memo(() => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem("jwt");
    const currentProject = useStoreState((state) => state.selectedProjectId);
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const isNavigationCollapsed =
      localStorage.getItem("isNavigationCollapsed") === "true";
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [openFileUpload, setOpenFileUpload] = useState(false);
    const userMessageRef = useRef(null);
    const chatPanelRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [openConfirmDelete, setConfirmDelete] = useState(false);
    const deleteProjectRef = useRef(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [projectStatus, setProjectStatus] = useState(false);
    const projectProcessing =
      localStorage.getItem("projectProcessing") === "true";
  
    const socket = useMemo(() => getSocket(), []);
  
    const isTokenExpired = useCallback((token) => {
      const payloadBase64 = token.split(".")[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;
      const now = Date.now().valueOf() / 1000;
      return now > exp;
    }, []);
  
    const checkProjects = useCallback(() => {
      if (!currentProject) {
        navigate("/chat");
      } else {
        navigate(`/chat/${currentProject}`);
      }
    }, [currentProject, navigate]);

    useEffect(() => {
      const handleResize = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
    
      handleResize();
      window.addEventListener('resize', handleResize);
    
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    useEffect(() => {
      document.title = "Yedu";
  
      const isLoggedIn = () => {
        const token = jwt;
        return token != null && !isTokenExpired(token);
      };
  
      if (!isLoggedIn()) {
        localStorage.clear();
        navigate("/");
        toast.info("You are not logged in", { autoClose: 5000 });
      } else {
        checkProjects();
      }
  
      if (currentProject) {
        socket.emit("join", currentProject);
      }
  
      const handleInitialData = (data) => {
        if (currentProject) {
          setMessages(data.messages.map((msg) => ({ ...msg, isNew: false })));
          setInitialLoadComplete(true);
        }
      };
  
      const handleNewMessage = (newMessage) => {
        setProjectStatus(newMessage.projectProcessing);
        localStorage.setItem("projectProcessing", newMessage.projectProcessing);
  
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: newMessage.role,
            content: newMessage.content,
            timestamp: new Date().toISOString(),
            imageUrl: newMessage.imageUrl || null,
            isNew: true,
          },
        ]);
  
        if (newMessage.role === "assistant") {
          setIsPending(false);
        }
  
        if (newMessage.projectProcessing) {
          setIsPending(true);
        }
      };
  
      socket.on("initial-data", handleInitialData);
      socket.on("new-message", handleNewMessage);
  
      if (projectProcessing) {
        setIsPending(true);
      }
  
      return () => {
        socket.off("initial-data", handleInitialData);
        socket.off("new-message", handleNewMessage);
      };
    }, [
      jwt,
      navigate,
      currentProject,
      socket,
      isTokenExpired,
      checkProjects,
      projectProcessing,
    ]);
  
    useEffect(() => {
      const handleScroll = () => {
        const chatPanel = chatPanelRef.current;
        if (chatPanel) {
          const isScrollable = chatPanel.scrollHeight > chatPanel.clientHeight;
          const isScrollBelowThreshold =
            chatPanel.scrollTop < chatPanel.scrollHeight * 0.8;
          setShowScrollButton(
            isScrollable && isScrollBelowThreshold && messages.length > 0,
          );
        }
      };
    
      const chatPanel = chatPanelRef.current;
      if (chatPanel) {
        chatPanel.addEventListener("scroll", handleScroll);
        handleScroll();
    
        return () => {
          chatPanel.removeEventListener("scroll", handleScroll);
        };
      }
    }, [messages]);
  
    const scrollToBottom = useCallback(() => {
  if (chatPanelRef.current) {
    chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
  }
}, []);
    
  
    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);
  
    const handleMessageSend = useCallback(
      async (message) => {
        if (!currentProject) {
          toast.info(
            "There is no project selected! Create a project or select one of your previous projects.",
          );
          return;
        }
  
        if (!message.trim()) {
          toast.error("Cannot send an empty message");
          return;
        }
  
        if (userMessageRef.current) {
          userMessageRef.current.value = "";
        }
  
        try {
          setIsPending(true);
          socket.emit("send-message", {
            message: message,
            projectId: currentProject,
          });
        } catch (error) {
          console.error("Error sending message:", error);
          toast.error("Failed to send message. Please try again later.");
        }
      },
      [currentProject, socket],
    );
  
    const handleKeyDown = useCallback(
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleMessageSend(userMessage);
        }
      },
      [handleMessageSend, userMessage],
    );
  
    useEffect(() => {
      const links = document.querySelectorAll("a");
      links.forEach((link) => {
        link.setAttribute("target", "_blank");
      });
    }, [messages]);
  
    const isMobile = useMediaQuery({ maxWidth: 767 });
const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1199 });
const isDesktop = useMediaQuery({ minWidth: 1200 });

const commonContent = (
  <>
    <CreateProject
      display={openCreateProject}
      setDisplay={setOpenCreateProject}
    />
    <FileUpload display={openFileUpload} setDisplay={setOpenFileUpload} />
    <ConfirmDeleteProject
      display={openConfirmDelete}
      setDisplay={setConfirmDelete}
      deleteProjectRef={deleteProjectRef}
    />
    <Navigation
      sideMenu={isNavigationCollapsed}
      setSideMenu={setSideMenu}
      confirmDeleteDisplay={openConfirmDelete}
      setConfirmDeleteDisplay={setConfirmDelete}
    />
  </>
);

const renderChatMessagesDesktop = () => (
  <>
    {messages.length <= 0 && (
      <div className="grid grid-cols-4 gap-4 mt-8">
        {[
          {
            icon: plane,
            text: "What can you do?",
            message: "What can you do?",
          },
          {
            icon: lightbulb,
            text: "What is a domain name?",
            message: "What is a domain name?",
          },
          {
            icon: pen,
            text: "What is web hosting?",
            message: "What is web hosting?",
          },
          {
            icon: cap,
            text: "What is Yedu AI about?",
            message: "What is Yedu AI about?",
          },
        ].map((item, index) => (
          <button
            key={index}
            className="flex flex-col justify-between border-2 border-gray-400 rounded-3xl p-4 h-32 hover:bg-yedu-light-green dark:hover:bg-green-500 transition-colors duration-300 bg-white dark:bg-[#333]"
            onClick={() => handleMessageSend(item.message)}
          >
            <img
              src={item.icon}
              alt=""
              className="w-6 h-6 self-start"
            />
            <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-2 text-left">
              {item.text}
            </p>
          </button>
        ))}
      </div>
    )}
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        logo={logo}
        initialLoadComplete={initialLoadComplete}
      />
    ))}
    {isPending && messages.length > 0 && (
      <div className="self-start w-[10%] text-center text-4xl text-yedu-dark  transition-all rounded-md">
        <i className="fas fa-ellipsis animate-bounce"> </i>
      </div>
    )}
  </>
);

const renderChatMessagesTablet = () => (
  <>
    {messages.length <= 0 && (
      <div className="grid grid-cols-2 gap-4 mt-8">
        {[
          {
            icon: plane,
            text: "What can you do?",
            message: "What can you do?",
          },
          {
            icon: lightbulb,
            text: "What is a domain name?",
            message: "What is a domain name?",
          },
          {
            icon: pen,
            text: "What is web hosting?",
            message: "What is web hosting?",
          },
          {
            icon: cap,
            text: "What is Yedu AI about?",
            message: "What is Yedu AI about?",
          },
        ].map((item, index) => (
          <button
            key={index}
            className="flex flex-col justify-between border-2 border-gray-400 rounded-3xl p-4 h-28 hover:bg-yedu-light-green dark:hover:bg-green-500 transition-colors duration-300 bg-white dark:bg-[#333]"
            onClick={() => handleMessageSend(item.message)}
          >
            <img
              src={item.icon}
              alt=""
              className="w-5 h-5 self-start"
            />
            <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-2 text-left">
              {item.text}
            </p>
          </button>
        ))}
      </div>
    )}
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        logo={logo}
        initialLoadComplete={initialLoadComplete}
      />
    ))}
    {isPending && messages.length > 0 && (
      <div className="self-start w-[15%] text-center text-3xl text-yedu-dark bg-yedu-light-green transition-all rounded-md">
        <i className="fas fa-ellipsis animate-bounce"> </i>
      </div>
    )}
  </>
);

const renderChatInputDesktop = () => (
  <div className="flex items-center justify-center w-full md:w-[80%] relative m-auto">
    <button
      className="transition-all hover:scale-125 absolute left-4 z-10"
      onClick={() => {
        if (projectProcessing) {
          return;
        }
        if (currentProject) {
          setOpenFileUpload(true);
        } else {
          toast.info("You need to create or select a project first");
        }
      }}
    >
      <i className="fas fa-paperclip text-2xl text-[black] dark:text-yedu-white"></i>
    </button>
    <textarea
      tabIndex={0}
      type="text"
      className="bg-gray-100 dark:bg-[#28282B] dark:text-white w-[100%] min-h-10 pt-4 border-0 dark:border dark:border-gray-600 rounded-3xl px-12 outline-none text-[1rem] scrollbar-none resize-none max-h-56 placeholder:text-yedu-gray-text dark:placeholder:text-yedu-dark-gray shadow-inner"
      spellCheck={false}
      placeholder="Message Yedu"
      onChange={(e) => setUserMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      ref={userMessageRef}
      disabled={isPending}
    />
    <button
      className="absolute right-4 hover:opacity-80 text-2xl transition-all duration-300"
      onClick={() => handleMessageSend(userMessage)}
      disabled={isPending}
      title="Send message"
    >
      <i
        className={`fas ${isPending ? "fa-spinner animate-spin p-2" : "fa-chevron-right px-3 py-2"} bg-green-500 dark:bg-gray-500 opacity-[0.7] rounded-full text-yedu-white`}
      ></i>
    </button>
  </div>
);

const renderChatInputTablet = () => (
  <div className="flex items-center justify-center w-full md:w-[90%] relative m-auto">
    <button
      className="transition-all hover:scale-115 absolute left-3 z-10"
      onClick={() => {
        if (projectProcessing) {
          return;
        }
        if (currentProject) {
          setOpenFileUpload(true);
        } else {
          toast.info("You need to create or select a project first");
        }
      }}
    >
      <i className="fas fa-paperclip text-xl text-[black] dark:text-yedu-white"></i>
    </button>
    <textarea
      tabIndex={0}
      type="text"
      className="bg-gray-100 dark:bg-[#28282B] dark:text-white w-[100%] min-h-10 pt-3 border-0 dark:border dark:border-gray-600 rounded-3xl px-10 outline-none text-[0.95rem] scrollbar-none resize-none max-h-40 placeholder:text-yedu-gray-text dark:placeholder:text-yedu-dark-gray shadow-inner"
      spellCheck={false}
      placeholder="Message Yedu"
      onChange={(e) => setUserMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      ref={userMessageRef}
      disabled={isPending}
    />
    <button
      className="absolute right-3 hover:opacity-80 text-xl transition-all duration-300"
      onClick={() => handleMessageSend(userMessage)}
      disabled={isPending}
      title="Send message"
    >
      <i
        className={`fas ${isPending ? "fa-spinner animate-spin p-1.5" : "fa-chevron-right px-2.5 py-1.5"} bg-green-500 dark:bg-gray-500 opacity-[0.7] rounded-full text-yedu-white`}
      ></i>
    </button>
  </div>
);

const renderChatMessagesMobile = () => (
  <>
    {messages.map((message, index) => (
      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <ChatMessage
          message={message}
          logo={logo}
          initialLoadComplete={initialLoadComplete}
          className={`max-w-[80%] ${message.role === 'user' ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3 mb-2`}
        />
      </div>
    ))}
    {isPending && messages.length > 0 && (
      <div className={`self-start w-[20%] text-center text-3xl text-yedu-dark bg-yedu-light-green transition-all rounded-md`}>
        <i className="fas fa-ellipsis animate-bounce"> </i>
      </div>
    )}
  </>
);

const renderChatInputMobile = () => (
  <div className="flex items-center justify-center w-full relative m-auto bg-white dark:bg-[#28282B] p-2 border-t border-gray-200 dark:border-gray-700">
    <button
      className="transition-all hover:scale-110 mr-2"
      onClick={() => {
        if (projectProcessing) {
          return;
        }
        if (currentProject) {
          setOpenFileUpload(true);
        } else {
          toast.info("You need to create or select a project first");
        }
      }}
    >
      <i className="fas fa-paperclip text-xl text-[black] dark:text-yedu-white"></i>
    </button>
    <textarea
      tabIndex={0}
      type="text"
      className="flex-grow bg-gray-100 dark:bg-[#28282B] dark:text-white min-h-10 py-2 px-4 border-0 rounded-lg outline-none text-[1rem] scrollbar-none resize-none max-h-20 placeholder:text-yedu-gray-text dark:placeholder:text-yedu-dark-gray shadow-inner"
      spellCheck={false}
      placeholder="Message Yedu"
      onChange={(e) => setUserMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      ref={userMessageRef}
      disabled={isPending}
    />
    <button
      className="ml-2 hover:opacity-80 text-xl transition-all duration-300"
      onClick={() => handleMessageSend(userMessage)}
      disabled={isPending}
      title="Send message"
    >
      <i className={`fas ${isPending ? "fa-spinner animate-spin p-1" : "fa-chevron-right px-2 py-1"} bg-green-500 dark:bg-gray-500 opacity-[0.7] rounded-full text-yedu-white`}></i>
    </button>
  </div>
);

return (
  <>
    {commonContent}
    <section
      className={`
        h-screen 
        ${messages.length > 0 ? "pt-[4em]" : "pt-[1em]"} 
        overflow-hidden 
        bg-gradient-to-br 
        from-gray-100 via-gray-200 to-green-50
        dark:bg-[#28282B] dark:bg-opacity-95
        dark:from-transparent dark:via-transparent dark:to-transparent
        flex flex-col
      `}
    >
      {isMobile && (
        <>
          <div className={`flex-grow overflow-y-auto transition-all`}>
            <div
              className={`w-[95%] m-auto scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull relative ${showScrollButton ? "pb-28" : "pb-36"} ${messages.length > 0 ? "h-full overflow-y-scroll" : ""}`}
              ref={chatPanelRef}
            >
              <div
                className={`flex w-full transition-all m-auto relative ${messages.length > 0 ? "flex-col gap-6 mt-8" : "justify-center gap-4 mt-24"}`}
              >
                {renderChatMessagesMobile()}
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 pt-3">
              {renderChatInputMobile()}
            </div>
          </div>
        </>
      )}

{isTablet && (
  <>
    <div className={`flex-grow overflow-y-auto transition-all ${sideMenu ? "md:translate-x-[10%]" : ""}`}>
      <div
        className={`w-full m-auto scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull relative ${showScrollButton ? "pb-28" : "pb-36"} ${messages.length > 0 ? "h-full overflow-y-scroll" : ""}`}
        ref={chatPanelRef}
      >
        <div
          className={`flex w-4/5 transition-all m-auto relative ${messages.length > 0 ? "flex-col gap-6 mt-10" : "justify-center gap-4 mt-28"}`}
        >
          {renderChatMessagesTablet()}
        </div>
      </div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 pt-3">
      {renderChatInputMobile()}
    </div>
  </>
)}

      {isDesktop && (
        <div className={`flex-grow overflow-y-auto transition-all ${sideMenu ? "md:translate-x-[12%]" : ""}`}>
          <div
            className={`w-full m-auto scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull relative ${showScrollButton ? "pb-28" : "pb-36"} ${messages.length > 0 ? "h-full overflow-y-scroll" : ""}`}
            ref={chatPanelRef}
          >
            <div
              className={`flex w-3/5 transition-all m-auto relative ${messages.length > 0 ? "flex-col gap-8 mt-12" : "justify-center gap-4 mt-36"}`}
            >
              {renderChatMessagesDesktop()}
            </div>
          </div>
          <div className="fixed bottom-0 left-2/4 -translate-x-2/4 flex flex-col gap-2 w-3/5 m-auto mt-8 pb-4 pt-2">
            {renderChatInputDesktop()}
          </div>
        </div>
      )}
    </section>
  </>
);
  });
  
  export default Chat;
  