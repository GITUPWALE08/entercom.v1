import { Outlet } from 'react-router-dom';
import Layout from '../components/layout';
import { SupportWidget } from '../features/chat/components/SupportWidget';

export function PublicLayout() {
  return (
    <Layout>
      <Outlet />
      <SupportWidget />
    </Layout>
  );
}
