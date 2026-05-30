import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata.contact;

export default function ContactLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}