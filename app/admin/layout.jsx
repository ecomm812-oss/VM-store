import AdminLayout from "@/components/admin/AdminLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata.adminDashboard;

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
