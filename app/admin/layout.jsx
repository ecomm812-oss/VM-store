import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "VM Cart - Admin",
    description: "VM Cart - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
