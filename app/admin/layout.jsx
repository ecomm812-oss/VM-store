import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "Admin Dashboard - VM Cart Platform Management",
    description: "VM Cart platform administration panel. Manage stores, approvals, coupons, and platform operations.",
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
