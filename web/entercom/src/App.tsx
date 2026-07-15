import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import Home from './pages/home';
import Contact from './pages/contact';
import Services from './pages/services';
import Products from './pages/products';
import About from './pages/about';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

    </Layout>
  );
}

export default App;