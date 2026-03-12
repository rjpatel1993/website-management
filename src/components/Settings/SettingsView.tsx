import { useState } from 'react';
import { Settings, List, Users, Bell } from 'lucide-react';
import { ChecklistTemplatesSection } from './ChecklistTemplatesSection';
import { UserManagement } from './UserManagement';

type TabType = 'general' | 'templates' | 'team' | 'notifications' | 'users';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'templates' as TabType, label: 'Checklist Templates', icon: List },
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'team' as TabType, label: 'Team', icon: Users },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Manage your workspace preferences and configurations</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
              <p className="text-sm sm:text-base text-gray-600">General preferences coming soon...</p>
            </div>
          )}

          {activeTab === 'templates' && <ChecklistTemplatesSection />}

          {activeTab === 'users' && <UserManagement />}

          {activeTab === 'team' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Team Settings</h2>
              <p className="text-sm sm:text-base text-gray-600">Team management coming soon...</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
              <p className="text-sm sm:text-base text-gray-600">Notification preferences coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
