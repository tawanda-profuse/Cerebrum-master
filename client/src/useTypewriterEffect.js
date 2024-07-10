import { useState, useEffect } from 'react';

const useTypewriterEffect = (text, speed = 20) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentText, setCurrentText] = useState(text);

    useEffect(() => {
        // Clear previous intervals
        setDisplayedText('');
        setCurrentText(text);
    }, [text]);

    useEffect(() => {
        let index = 0;

        const intervalId = setInterval(() => {
            setDisplayedText((prev) => {
                if (currentText && index < currentText.length) {
                    // Check if currentText is defined
                    index++;
                    return currentText.substring(0, index);
                } else {
                    clearInterval(intervalId);
                    return prev;
                }
            });
        }, speed);

        return () => clearInterval(intervalId);
    }, [currentText, speed]);

    return displayedText;
};

export default useTypewriterEffect;
