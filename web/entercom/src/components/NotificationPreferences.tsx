import { useNotificationPreferences } from '../hooks/useNotifications';

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreference, createPreference } = useNotificationPreferences();

  const categories = [
    { id: 'alerts', label: 'Security Alerts', description: 'Critical security and system alerts' },
    { id: 'updates', label: 'System Updates', description: 'Updates about your services and requests' },
    { id: 'marketing', label: 'News & Offers', description: 'Entercom news and promotional offers' }
  ];

  const channels = ['email', 'push', 'in_app'];

  if (isLoading) {
    return <div className="py-4 text-gray-500 animate-pulse">Loading preferences...</div>;
  }

  const handleToggle = (category: string, channel: string, currentEnabled: boolean, prefId?: string) => {
    if (prefId) {
      updatePreference.mutate({ id: prefId, is_enabled: !currentEnabled });
    } else {
      createPreference.mutate({ category, channel, is_enabled: !currentEnabled });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-500">Choose how you want to be notified for different events.</p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{cat.label}</h4>
              <p className="text-xs text-gray-500">{cat.description}</p>
            </div>
            <div className="divide-y divide-gray-100 bg-white">
              {channels.map((channel) => {
                const pref = preferences.find(p => p.category === cat.id && p.channel === channel);
                // Default to true for in_app and email alerts if no preference is explicitly set
                const isEnabled = pref ? pref.is_enabled : (channel !== 'push');

                return (
                  <div key={channel} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {channel === 'in_app' ? 'In-App Notifications' : channel}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isEnabled}
                        onChange={() => handleToggle(cat.id, channel, isEnabled, pref?.id)}
                        disabled={updatePreference.isPending || createPreference.isPending}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ess-purple disabled:opacity-50"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
