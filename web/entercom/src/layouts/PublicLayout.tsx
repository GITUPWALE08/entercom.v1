import { Outlet } from 'react-router-dom';
import Layout from '../components/layout';

export function PublicLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
