import { Outlet } from 'react-router-dom';
import Layout from '../components/layout';
import { SupportWidget } from '../features/chat/components/SupportWidget';
import { ScrollToTop } from '../components/ScrollToTop';

export function PublicLayout() {
  return (
    <Layout>
      <ScrollToTop />
      <Outlet />
      <SupportWidget />
    </Layout>
  );
}
