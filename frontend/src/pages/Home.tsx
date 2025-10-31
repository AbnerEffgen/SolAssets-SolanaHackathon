import DashboardLayout from "@/components/DashboardLayout";
import { WavyBackground } from "@/components/ui/background";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import logo from "@/assets/logo.svg";

const Home = () => {
    const background = (
        <WavyBackground
            backgroundFill="hsl(var(--background))"
            colors={["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]}
            waveWidth={20}
            blur={10}
        />
    );

    const words = [
        {
            text: "Welcome",
            className: "text-white",
        },
        {
            text: "to",
            className: "text-white",
        },
        {
            text: "SolAssets.",
            className: "bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary",
        },
    ];

    return (
        <DashboardLayout background={background} noPadding>
            <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
                <TypewriterEffect words={words} className="text-7xl md:text-9xl lg:text-10xl" />
            </div>
        </DashboardLayout>
    );
};

export default Home;