import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata.subscription;

export default function SubscriptionLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}