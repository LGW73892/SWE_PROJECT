import { useState } from "react";
import { RouterProvider } from 'react-router';
import { Toaster } from "sonner";
import { router } from './routes';
import SplashScreen from './components/SplashScreen';

export default function App() {
    const [splashDone, setSplashDone] = useState(false);

    return (
        <>
            {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
        </>
    );
}