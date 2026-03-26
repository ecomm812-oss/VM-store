import StoreLayout from "@/components/store/StoreLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata.storeDashboard;

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
