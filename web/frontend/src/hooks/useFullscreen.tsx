import { createContext, useContext, useState, ReactNode } from "react";

export const FullscreenContext = createContext({
    fullscreen: false,
    setFullscreen: (_: boolean) => {},
});

export const FullscreenProvider = ({ children }: { children: ReactNode }) => {
    const [fullscreen, setFullscreen] = useState(false);

    return (
        <FullscreenContext.Provider value={{ fullscreen, setFullscreen }}>
            {children}
        </FullscreenContext.Provider>
    );
};

export const useFullscreen = () => {
    return useContext(FullscreenContext);
};