import { useState } from "react";
import WelcomePage from "@/pages/WelcomePage";
import GenderSelection from "@/pages/GenderSelection";
import SkincareWizard from "@/pages/SkincareWizard";

export default function Home() {
    const [stage, setStage] = useState<'welcome' | 'gender' | 'wizard'>('welcome');

    if (stage === 'welcome') {
        return <WelcomePage onNext={() => setStage('gender')} />;
    }

    if (stage === 'gender') {
        return <GenderSelection onNext={() => setStage('wizard')} />;
    }

    return <SkincareWizard />;
}
