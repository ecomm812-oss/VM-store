import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "Seller Dashboard - VM Cart Store Management",
    description: "Access your seller dashboard on VM Cart. Manage products, orders, analytics, and grow your online store.",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
