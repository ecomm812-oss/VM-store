import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "VM Cart - Store Dashboard",
    description: "VM Cart - Store Dashboard",
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
