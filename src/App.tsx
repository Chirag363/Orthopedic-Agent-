import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Chat } from './components/Chat';
import { Footer } from './components/Footer';
import AnimatedCursor from "react-animated-cursor";
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <div className="App">
                <AnimatedCursor />
                <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black flex flex-col">
                    <Header />
                    <Hero />
                    <main id="chat-section" className="flex-1 container mx-auto px-4 py-16">
                        <Chat />
                    </main>
                    <Footer />
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;

