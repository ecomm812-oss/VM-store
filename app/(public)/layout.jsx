import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata.home;

export default function PublicLayout({ children }) {

    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
