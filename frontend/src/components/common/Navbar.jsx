import { Link, useLocation } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isHomePage = useLocation().pathname === '/';

  return (
    <nav className="bg-blue-50 shadow px-8 h-16 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold text-blue-900">
          MeetApp
        </Link>
        <Link
          to="/"
          className={`border-b-2 px-1 pt-1 text-sm font-medium ${
            isHomePage 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-blue-500 hover:text-blue-600'
          }`}
        >
          Spaces
        </Link>
      </div>

      <Menu as="div" className="relative">
        <Menu.Button className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <UserIcon className="h-5 w-5" />
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
          <div className="p-3 border-b">
            <div className="text-sm text-gray-800">{user?.username || 'User'}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={logout}
                className={`w-full p-3 text-left text-sm ${active ? 'bg-gray-100' : ''}`}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </nav>
  );
}