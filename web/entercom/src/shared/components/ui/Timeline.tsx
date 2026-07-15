
interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  status?: string;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
      {events.map((event) => (
        <div key={event.id} className="relative pl-6">
          <div className="absolute w-4 h-4 bg-ess-purple rounded-full -left-[9px] top-1 border-4 border-white shadow-sm" />
          <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{new Date(event.date).toLocaleString()}</p>
          {event.description && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">{event.description}</p>}
        </div>
      ))}
    </div>
  );
}
