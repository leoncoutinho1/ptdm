import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Products } from './pages/Products/Products';
import { ProductForm } from './pages/Products/ProductForm';
import { PaymentFormList } from './pages/Settings/PaymentForm/PaymentFormList';
import { PaymentFormForm } from './pages/Settings/PaymentForm/PaymentFormForm';
import { CashierList } from './pages/Settings/Cashier/CashierList';
import { CashierForm } from './pages/Settings/Cashier/CashierForm';
import { CheckoutList } from './pages/Settings/Checkout/CheckoutList';
import { CheckoutForm } from './pages/Settings/Checkout/CheckoutForm';
import { AuthProvider } from './contexts/AuthContext';
import { SaleForm } from './pages/Sales/SaleForm';
import { SaleList } from './pages/Sales/SaleList';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/home', element: <HomePage /> },
      { path: '/products', element: <Products /> },
      { path: '/products/new', element: <ProductForm /> },
      { path: '/products/:id', element: <ProductForm /> },

      // Sales route
      { path: '/sales', element: <SaleList /> },
      { path: '/sales/new', element: <SaleForm /> },
      { path: '/sales/:id', element: <SaleForm /> },

      // Settings routes
      { path: '/settings/payment-forms', element: <PaymentFormList /> },
      { path: '/settings/payment-forms/new', element: <PaymentFormForm /> },
      { path: '/settings/payment-forms/:id', element: <PaymentFormForm /> },

      { path: '/settings/cashiers', element: <CashierList /> },
      { path: '/settings/cashiers/new', element: <CashierForm /> },
      { path: '/settings/cashiers/:id', element: <CashierForm /> },

      { path: '/settings/checkouts', element: <CheckoutList /> },
      { path: '/settings/checkouts/new', element: <CheckoutForm /> },
      { path: '/settings/checkouts/:id', element: <CheckoutForm /> }
    ]
  }
]);

export function Router() {

  return <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
    ;
}
