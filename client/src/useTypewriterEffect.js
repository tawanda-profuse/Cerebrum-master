import { useState, useEffect } from 'react';

const useTypewriterEffect = (text, speed = 50) => {
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
                if (index < currentText.length) {
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
