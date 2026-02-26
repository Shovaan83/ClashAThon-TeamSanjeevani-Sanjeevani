import { NavLink, Outlet } from 'react-router-dom';

export default function AdminDashboard() {
  const navItems = [
    { name: 'Pharmacies', path: '/admin/pharmacies' },
    { name: 'KYCs', path: '/admin/kyc' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="flex-1">
          <ul className="space-y-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block py-2 px-4 rounded hover:bg-gray-700 transition ${
                      isActive ? 'bg-yellow-500 text-gray-900 font-semibold' : 'text-gray-300'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}